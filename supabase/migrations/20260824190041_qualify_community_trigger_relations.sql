-- Auth-admin requests run with a restricted search_path. The original
-- SECURITY DEFINER Community triggers relied on an implicit `public` search
-- path, which made ON DELETE CASCADE fail during account deletion. Qualify all
-- Community relations and pin a safe search path for both admin and app calls.

create or replace function public.update_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' then
    update public.community_posts
      set like_count = like_count + 1
      where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.community_posts
      set like_count = greatest(like_count - 1, 0)
      where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create or replace function public.update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' and NEW.parent_comment_id is null then
    update public.community_posts
      set comment_count = comment_count + 1
      where id = NEW.post_id;
  elsif TG_OP = 'DELETE' and OLD.parent_comment_id is null then
    update public.community_posts
      set comment_count = greatest(comment_count - 1, 0)
      where id = OLD.post_id;
  end if;
  return null;
end;
$$;

create or replace function public.update_poll_option_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if TG_OP = 'INSERT' then
    update public.community_poll_options
      set vote_count = vote_count + 1
      where id = NEW.option_id;
  elsif TG_OP = 'DELETE' then
    update public.community_poll_options
      set vote_count = greatest(vote_count - 1, 0)
      where id = OLD.option_id;
  end if;
  return null;
end;
$$;

create or replace function public.handle_report_threshold()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  report_count int;
  post_rec record;
begin
  select count(*) into report_count
    from public.community_reports where post_id = NEW.post_id;

  if report_count >= 3 then
    select user_id, content into post_rec
      from public.community_posts where id = NEW.post_id;

    insert into public.community_notifications
      (user_id, type, post_id, post_snippet, action, reason)
    values
      (post_rec.user_id, 'post_actioned', NEW.post_id,
       left(post_rec.content, 60), 'removed', NEW.reason)
    on conflict do nothing;
  end if;

  return NEW;
end;
$$;

create or replace function public.handle_community_like()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post_author uuid;
  v_actor_name text;
  v_existing_id uuid;
begin
  select user_id into v_post_author
    from public.community_posts where id = NEW.post_id;

  if v_post_author is null or v_post_author = NEW.user_id then
    return NEW;
  end if;

  select nickname into v_actor_name
    from public.profiles where user_id = NEW.user_id;

  select id into v_existing_id
    from public.community_notifications
    where user_id = v_post_author
      and type = 'like'
      and post_id = NEW.post_id
      and read = false
    limit 1;

  if v_existing_id is not null then
    update public.community_notifications
      set actor_count = actor_count + 1,
          actor_name = v_actor_name,
          updated_at = now()
      where id = v_existing_id;
  else
    insert into public.community_notifications
      (user_id, type, post_id, actor_name, actor_count, updated_at)
    values (v_post_author, 'like', NEW.post_id, v_actor_name, 1, now());
  end if;

  return NEW;
end;
$$;

create or replace function public.handle_community_comment()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_post_author uuid;
  v_parent_author uuid;
  v_actor_name text;
  v_existing_id uuid;
begin
  select nickname into v_actor_name
    from public.profiles where user_id = NEW.user_id;

  if NEW.parent_comment_id is null then
    select user_id into v_post_author
      from public.community_posts where id = NEW.post_id;

    if v_post_author is null or v_post_author = NEW.user_id then
      return NEW;
    end if;

    insert into public.community_notifications
      (user_id, type, post_id, actor_name, actor_count, updated_at)
    values (v_post_author, 'comment', NEW.post_id, v_actor_name, 1, now());
  else
    select user_id into v_parent_author
      from public.community_comments where id = NEW.parent_comment_id;

    if v_parent_author is null or v_parent_author = NEW.user_id then
      return NEW;
    end if;

    select id into v_existing_id
      from public.community_notifications
      where user_id = v_parent_author
        and type = 'reply'
        and comment_id = NEW.parent_comment_id
        and read = false
      limit 1;

    if v_existing_id is not null then
      update public.community_notifications
        set actor_count = actor_count + 1,
            actor_name = v_actor_name,
            updated_at = now()
        where id = v_existing_id;
    else
      insert into public.community_notifications
        (user_id, type, post_id, comment_id, actor_name, actor_count, updated_at)
      values
        (v_parent_author, 'reply', NEW.post_id, NEW.parent_comment_id, v_actor_name, 1, now());
    end if;
  end if;

  return NEW;
end;
$$;

do $$
declare
  owner_id uuid;
  post_id uuid;
begin
  select id into owner_id
  from auth.users
  order by created_at asc
  limit 1;

  if owner_id is null then
    raise exception 'No auth user found.';
  end if;

  insert into public.community_posts (
    user_id,
    content,
    image_url,
    category,
    is_system_post,
    system_category,
    is_discussion_prompt,
    like_count,
    comment_count,
    created_at
  )
  values (
    owner_id,
    'When pain starts building, what helps you feel most prepared in the moment?',
    null,
    'pain',
    true,
    'pain',
    false,
    51,
    0,
    now() - interval '5 minutes'
  )
  returning id into post_id;

  insert into public.community_poll_options (post_id, option_text, sort_order)
  values
    (post_id, 'Having meds nearby', 1),
    (post_id, 'Heat or warmth', 2),
    (post_id, 'Calling someone', 3),
    (post_id, 'Resting early', 4);
end $$;
do $$
declare
  owner_id uuid;
  wins_post_id uuid;
  mental_post_id uuid;
  tips_post_id uuid;
  pain_post_id uuid;
begin
  select id into owner_id
  from auth.users
  order by created_at asc
  limit 1;

  if owner_id is null then
    raise exception 'No auth user found.';
  end if;

  select id into wins_post_id
  from public.community_posts
  where content = 'What’s one small win from this week that you want to give yourself credit for?'
  order by created_at desc
  limit 1;

  select id into mental_post_id
  from public.community_posts
  where content = 'On a hard health day, what kind of support actually feels helpful?'
  order by created_at desc
  limit 1;

  select id into tips_post_id
  from public.community_posts
  where content = 'What helps you feel more prepared before a hospital visit or appointment?'
  order by created_at desc
  limit 1;

  select id into pain_post_id
  from public.community_posts
  where content = 'When pain starts building, what helps you feel most prepared in the moment?'
  order by created_at desc
  limit 1;

  if wins_post_id is not null then
    insert into public.community_comments (post_id, user_id, content, created_at)
    values
      (wins_post_id, owner_id, 'I made it through a full workday without needing to cancel plans afterwards. That felt huge.', now() - interval '8 minutes'),
      (wins_post_id, owner_id, 'I finally booked an appointment I had been avoiding. Small thing, but I’m proud of it.', now() - interval '6 minutes'),
      (wins_post_id, owner_id, 'Drank enough water three days in a row. That is genuinely a win for me.', now() - interval '4 minutes');
  end if;

  if mental_post_id is not null then
    insert into public.community_comments (post_id, user_id, content, created_at)
    values
      (mental_post_id, owner_id, 'Someone checking in without making me explain everything helps a lot.', now() - interval '12 minutes'),
      (mental_post_id, owner_id, 'Practical help. Food, errands, reminders. Those things matter when I am exhausted.', now() - interval '9 minutes'),
      (mental_post_id, owner_id, 'Honestly, space to rest alone — but knowing someone is nearby if I need them.', now() - interval '7 minutes');
  end if;

  if tips_post_id is not null then
    insert into public.community_comments (post_id, user_id, content, created_at)
    values
      (tips_post_id, owner_id, 'I keep a note in my phone with medications, allergies, and my haematology contact.', now() - interval '18 minutes'),
      (tips_post_id, owner_id, 'Packing a small hospital bag has helped me feel less panicked when I need to go in.', now() - interval '15 minutes'),
      (tips_post_id, owner_id, 'I write questions down before appointments because I forget everything once I’m there.', now() - interval '11 minutes');
  end if;

  if pain_post_id is not null then
    insert into public.community_comments (post_id, user_id, content, created_at)
    values
      (pain_post_id, owner_id, 'Heat pad first, then meds early if it keeps building.', now() - interval '5 minutes'),
      (pain_post_id, owner_id, 'Calling someone helps because I tend to wait too long before asking for help.', now() - interval '3 minutes'),
      (pain_post_id, owner_id, 'Resting early makes the biggest difference for me, even though I’m bad at doing it.', now() - interval '1 minute');
  end if;

  update public.community_posts p
  set comment_count = c.count
  from (
    select post_id, count(*)::integer as count
    from public.community_comments
    where post_id in (
      wins_post_id,
      mental_post_id,
      tips_post_id,
      pain_post_id
    )
    group by post_id
  ) c
  where p.id = c.post_id;
end $$;
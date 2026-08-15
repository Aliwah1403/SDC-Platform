do $$
declare
  owner_id uuid;
begin
  select id into owner_id
  from auth.users
  order by created_at asc
  limit 1;

  if owner_id is null then
    raise exception 'No auth user found. Sign up/log in once locally before inserting dummy community posts.';
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
  values
    (
      owner_id,
      'What’s one small win from this week that you want to give yourself credit for?',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=800&fit=crop&q=80&auto=format',
      'wins',
      true,
      'wins',
      true,
      42,
      0,
      now() - interval '10 minutes'
    ),
    (
      owner_id,
      'On a hard health day, what kind of support actually feels helpful?',
      'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&h=800&fit=crop&q=80&auto=format',
      'mental',
      true,
      'mental',
      true,
      35,
      0,
      now() - interval '20 minutes'
    ),
    (
      owner_id,
      'What helps you feel more prepared before a hospital visit or appointment?',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=800&fit=crop&q=80&auto=format',
      'tips',
      true,
      'tips',
      true,
      28,
      0,
      now() - interval '30 minutes'
    );
end $$;
-- Expand the default hydration-container set (2026-07-28). New accounts are
-- seeded with the richer set (Glass, Bottle, Mug, Boba, Carton) in
-- completeOnboarding(); this backfills the three added defaults onto existing
-- onboarded accounts so their quick-add carousel matches.
--
-- Additive and idempotent: only inserts a default the user doesn't already
-- have by name, and appends after their current containers — it never edits,
-- reorders, or deletes a user's existing or customized containers. The added
-- rows are all is_default = false, so the "one default per user" unique index
-- is untouched.
insert into hydration_containers (user_id, name, ml, icon, is_default, sort_order)
select
  p.user_id,
  v.name,
  v.ml,
  v.icon,
  false,
  coalesce(
    (select max(hc2.sort_order) from hydration_containers hc2 where hc2.user_id = p.user_id),
    -1
  ) + v.rn
from profiles p
cross join (values
  ('Mug', 350, 'mug', 1),
  ('Boba', 500, 'boba', 2),
  ('Carton', 1000, 'carton', 3)
) as v(name, ml, icon, rn)
where p.onboarding_complete = true
  and exists (
    select 1 from hydration_containers hc where hc.user_id = p.user_id
  )
  and not exists (
    select 1 from hydration_containers hc
    where hc.user_id = p.user_id and hc.name = v.name
  );;

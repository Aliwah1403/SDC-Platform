-- Boba was dropped from the default container set (2026-07-28), shortly after
-- 20260728130000_expand_default_containers backfilled it. Remove the auto-seeded
-- Boba rows. Scoped to the seeded shape (name + icon, non-default) so a Boba a
-- user deliberately created/renamed would not be caught.
delete from hydration_containers
where name = 'Boba'
  and icon = 'boba'
  and is_default = false;;

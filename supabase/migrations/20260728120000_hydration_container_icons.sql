-- Hydration containers: move from an emoji column to a named icon key
-- (2026-07-28). Containers are now rendered with line icons via
-- components/ContainerIcon.jsx, so each row stores an icon key such as
-- 'glass-water' instead of an emoji character. Non-destructive: the emoji
-- column is kept (now nullable) so any client still reading it keeps working,
-- and existing rows are backfilled by mapping their emoji to an icon key.

alter table hydration_containers
  add column if not exists icon text;

-- Backfill icon from the legacy emoji values seeded/created before this change.
-- Mapping mirrors emojiToIconKey() in constants/hydrationContainers.js.
update hydration_containers
set icon = case emoji
  when '🥛' then 'glass-water'
  when '🚰' then 'glass-water'
  when '💧' then 'glass-water'
  when '🍶' then 'bottle'
  when '🫙' then 'carton'
  when '🍵' then 'mug'
  when '☕' then 'mug'
  when '🧋' then 'boba'
  else 'glass-water'
end
where icon is null;

-- New rows are inserted with an icon and no emoji, so the emoji column can no
-- longer be NOT NULL.
alter table hydration_containers
  alter column emoji drop not null;

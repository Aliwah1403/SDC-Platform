
ALTER TABLE public.community_notifications REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_notifications;
;

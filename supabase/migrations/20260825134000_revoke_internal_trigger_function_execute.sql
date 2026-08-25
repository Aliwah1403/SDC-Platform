-- These SECURITY DEFINER functions are invoked only by database triggers.
-- They should not be callable through Supabase's public RPC API.
revoke execute on function public.handle_community_comment() from public, anon, authenticated;
revoke execute on function public.handle_community_like() from public, anon, authenticated;
revoke execute on function public.handle_community_notification_push() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_report_threshold() from public, anon, authenticated;
revoke execute on function public.trigger_waitlist_welcome_email() from public, anon, authenticated;
revoke execute on function public.update_poll_option_vote_count() from public, anon, authenticated;
revoke execute on function public.update_post_comment_count() from public, anon, authenticated;
revoke execute on function public.update_post_like_count() from public, anon, authenticated;

-- Public export functions deliberately retain EXECUTE: their opaque export
-- token is the access control for shared health-report links.

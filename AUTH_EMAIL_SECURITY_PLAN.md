# Hemo email-change OTP plan

Status: Planned — do not change the current email-change flow until this work is scheduled.

## Goal

Move email changes in the native app from confirmation links to OTP entry, while retaining Supabase’s two-address confirmation protection.

## Current state

- The email-change email currently contains a Supabase confirmation URL.
- `supabase/config.toml` has `double_confirm_changes = true`.
- The Supabase `send-email` hook currently maps `email_change` to one Resend template and one confirmation URL.
- The mobile app has an OTP-style password recovery screen but no email-change screen or email-change deep-link handler.

## Implementation plan

1. Add an email-change flow in the app settings/security area.
   - Require recent authentication or reauthentication before changing the address.
   - Collect and validate the new email address.
   - Call Supabase’s email update method with the appropriate redirect/context.

2. Update the Supabase send-email hook for secure email changes.
   - Handle both confirmation payloads produced by `double_confirm_changes`.
   - Send one OTP email to the current address and one to the new address.
   - Use code variables, not confirmation-link variables.
   - Keep the two email-change messages distinguishable so the user knows which inbox to check.

3. Add the app verification experience.
   - Show a “Check both inboxes” state.
   - Verify each code with `supabase.auth.verifyOtp` using the `email_change` type.
   - Support resend, expiry, invalid-code, and partially completed states.
   - Refresh the authenticated user after both confirmations succeed.
   - Show a clear success state with the new email address.

4. Update the Resend email templates.
   - Replace the current confirmation URL variable with the appropriate OTP variable(s).
   - Keep the Hemo layout and common footer.
   - Test both the current-email and new-email variants.

5. Test the full flow.
   - Verify that the old email remains active until confirmation requirements are complete.
   - Confirm that expired and reused codes fail safely.
   - Test app relaunch, resend, wrong-code, and one-inbox-only scenarios.
   - Verify the flow in development and a release-like build.

## References

- [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase send-email hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
- [Supabase native mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Supabase JavaScript `verifyOtp`](https://supabase.com/docs/reference/javascript/auth-verifyotp)

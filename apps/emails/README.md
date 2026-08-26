# Hemo emails

This is the local React Email workspace for designing and previewing Hemo's transactional emails.

## Preview locally

```sh
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Edit files in `emails/` and the preview updates automatically.

The templates currently mirror the Resend template IDs referenced by the system:

- `signup-confirmation`
- `welcome`
- `password-reset-verification`
- `magic-link`
- `email-change-confirmation`
- `user-invite`
- `waitlist-email`
- `admin-waitlist-notification`
- `admin-beta-signup-notification` (preview for the beta signup admin notification)
- `admin-contact-notification`
- `account-deleted`
- `data-export`

The sent Hemo broadcast designs are also available as previews:

- `beta-access`
- `beta-invitation`
- `beta-claim`
- `waitlist-update`

The shared layout is based on the sent Hemo broadcasts: white 600px canvas, Arial typography, Hemo logo and fingerprint mark, black body text, rose `#A9334D` actions and links, and the Hemo legal footer. The Supabase functions currently send Resend-hosted templates. These local React Email components are the design source and preview; their rendered HTML still needs to be copied into the matching Resend templates, or the sending path can later be migrated to render these components directly.

## Export HTML

```sh
npm run export
```

Exports rendered HTML and plain-text files to `out/`.

# Account details

Approved requirements: signed-in users can independently edit a display name,
unverified contact email, and profile photo at `/account`. Each inline editor has
Save and Cancel, pending feedback, validation, and recoverable errors. Username
login is unchanged. Empty names fall back to the username for existing accounts;
email can be cleared. Missing photos use the default avatar.

Implementation order: account metadata and validation; private photo storage and
image decoding; accessible editors and header refresh; unit, component, and local
Playwright verification. Use existing TypeScript/React conventions and CSS tokens.

Name: trimmed, 1–80 characters. Email: trimmed, valid format, max 254 characters,
or empty. Photos: JPEG/PNG/WebP, maximum 2 MB, decoded with a pixel limit and
re-encoded as WebP at maximum 512×512 with metadata stripped. Only the current
session's user can update metadata or access their UUID folder. Replaced photos
are removed after successful metadata saves; failed saves remove the new upload.

Validation: `npm run verify`, `npm run build`, and `npm run test:e2e` using Node 24
and npm 11. Cover persistence, cancel/error recovery, session expiry, invalid
files, access isolation, header refresh, and unchanged username login. Check
keyboard navigation and 320/768/1024/1440px layouts.

The avatar migration must be reviewed before application. Do not apply migrations
or deploy remotely outside the protected workflow. No credentials or generated
reports belong in version control.

References: [Supabase metadata updates](https://supabase.com/docs/reference/javascript/auth-updateuser),
[Storage policies](https://supabase.com/docs/guides/storage/security/access-control),
and [Sharp decoder limits](https://sharp.pixelplumbing.com/api-constructor/).

# Project memory

## Product intent & audience

- Vite + React starter project targeting production-ready web applications.
- Two distinct features now in play:
  - **PlantBoard**: zone-based board functionality, available to all users.
  - **Moodboard**: newer feature with image search and dedicated dialog, restricted to admins for now.
- Prior feature work: bulk image upload flow with database-backed image storage.

## Brand personality & voice

- See `.bolt/prompt` for authoritative design guidance; project must deliver polished, production-worthy UI, not generic templates.

## Visual design & UX direction

- JSX + Tailwind CSS for styling; Lucide React for icons and logos.
- Avoid adding UI/theme/icon packages unless explicitly requested.
- Zone UI contains buttons for both PlantBoard and Moodboard; PlantBoard button visible to all users, Moodboard button admin-only.
- Moodboard includes image search functionality and a dedicated dialog.
- UX pattern: existing data is preserved until new upload succeeds; errors must not silently remove user assets.
- Surface real operational limits to users (e.g., actual per-file size limit).

## Decisions, constraints & rationale

- **Access control split**: PlantBoard is available to all users; Moodboard is admin-only. These are now correctly separated and must not be coupled.
- The PlantBoard zone button was previously admin-restricted and has been reverted to all-user visibility.
- Bulk image upload must use the actual file MIME type instead of `application/octet-stream`.
- Supported image formats: JPG, JPEG, PNG, WEBP.
- Per-image limit: 5 MB (must be displayed accurately to users).
- Existing database image entries are replaced only after all new file uploads succeed; on failure, prior entries are retained to avoid data loss.
- Build verification is part of completing a change.

## Open questions & assumptions

- Assumption: backend exposes endpoints for image upload and database record replacement.
- Assumption: 5 MB limit is enforced server-side as well as communicated in UI.
- Assumption: admin role detection is available client-side for gating Moodboard visibility.
- Unknown: whether Moodboard will eventually be opened to all users.
- Unknown: whether other image formats (GIF, SVG, AVIF) should be supported later.
- Unknown: whether multi-image ordering, deletion, or retry UX is needed beyond current bulk replace flow.
# Project memory

## Product intent & audience

- Starter project scaffolded with Vite + React, targeting production-ready web applications.
- Current feature work centers on a bulk image upload flow with database-backed image storage.

## Brand personality & voice

- See `.bolt/prompt` for authoritative design guidance; project is expected to deliver polished, production-worthy UI, not generic templates.

## Visual design & UX direction

- JSX + Tailwind CSS for styling; Lucide React for icons and logos.
- Avoid adding UI/theme/icon packages unless explicitly requested.
- UX pattern: existing data is preserved until new upload succeeds; errors must not silently remove user assets.
- Surface real operational limits to users (e.g., actual per-file size limit).

## Decisions, constraints & rationale

- Bulk image upload must use the actual file MIME type instead of `application/octet-stream`.
- Supported image formats: JPG, JPEG, PNG, WEBP.
- Per-image limit: 5 MB (must be displayed accurately to users).
- Existing database image entries are replaced only after all new file uploads succeed; on failure, prior entries are retained to avoid data loss.
- Build verification is part of completing a change.

## Open questions & assumptions

- Assumption: backend exposes endpoints for image upload and database record replacement.
- Assumption: 5 MB limit is enforced server-side as well as communicated in UI.
- Unknown: whether other image formats (GIF, SVG, AVIF) should be supported later.
- Unknown: whether multi-image ordering, deletion, or retry UX is needed beyond current bulk replace flow.
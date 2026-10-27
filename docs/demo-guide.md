# Note Pinning Demo Guide

## Problem and feature overview

The original notes application allowed a signed-in user to create, list, and delete notes but offered no way to identify important ones. Note pinning adds a persisted `is_pinned` flag, an owner-protected API update, and an accessible React control that visibly marks a note as pinned.

## Architecture and request flow

1. A signed-in user clicks **Pin note** or **Unpin note** on a React `Note` card.
2. `Home.jsx` calls the existing Axios client with `PATCH /api/notes/{id}/` and a body containing only `is_pinned`.
3. The Axios interceptor supplies the stored JWT access token.
4. Django JWT authentication identifies the request user. `NotePinUpdate` filters notes by that user before locating the note.
5. `NotePinSerializer` validates a strict JSON boolean, writes only `is_pinned`, and returns the complete saved note representation.
6. React replaces only that note's local state with the response. It shows a success message, or retains the prior confirmed state and enables retry after an error.

## Database and migration

`api.Note` now has:

```python
is_pinned = models.BooleanField(default=False)
```

`backend/api/migrations/0002_note_is_pinned.py` is additive: it creates the column with a `false` default, so existing notes remain intact and unpinned. It does not drop tables or modify note ownership. Reversing this migration removes only the pin-state column and should be an explicit rollback decision.

## Local setup

The checked-in backend uses PostgreSQL. Do not point these commands at production.

1. Create or obtain an authorized isolated development PostgreSQL database and a role that can create Django's test database.
2. In a local secret-management mechanism, provide these backend environment variables without committing them:

   ```text
   SECRET_KEY=<development-only secret>
   DB_NAME=<development database name>
   DB_USER=<development database user>
   DB_PWD=<development database password>
   DB_HOST=<development database host>
   DB_PORT=5432
   DEBUG=True
   ```

3. Install and run the backend:

   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py test api
   python manage.py runserver
   ```

4. In a second terminal, install and run the frontend:

   ```powershell
   cd frontend
   npm install
   $env:VITE_API_URL = "http://localhost:8000"
   npm run dev
   ```

Open the URL printed by Vite, normally `http://localhost:5173`.

## API examples

All note requests require the JWT access token returned by the existing login flow.

Pin a note:

```http
PATCH /api/notes/7/
Authorization: Bearer <access-token>
Content-Type: application/json

{"is_pinned": true}
```

Successful response:

```json
{
  "id": 7,
  "title": "Prepare interview demo",
  "content": "Show pin and unpin behavior.",
  "is_pinned": true,
  "created_at": "2026-10-26T10:00:00Z",
  "author": 3
}
```

Unpin by sending `{"is_pinned": false}` to the same path.

Expected failures:

- `401` for a missing, invalid, or expired JWT.
- `404` for a missing note or a note not owned by the authenticated user.
- `400` for a missing pin value, a non-boolean value, or unrelated fields such as `title` or `author`.

## Manual demonstration script

1. Register and sign in through the existing UI.
2. Create a note using the existing form; it should initially be unpinned.
3. Select **Pin note**. The control displays an updating state, then the note shows a **Pinned** badge and an **Unpin note** control.
4. Reload the page. The badge should remain because `GET /api/notes/` returns the saved `is_pinned` value.
5. Select **Unpin note** and reload again. The badge should be absent.
6. In a separate account, attempt `PATCH /api/notes/{first-user-note-id}/` with a valid second-user token. Expect `404` and no change to the first user's note.
7. Send `{"is_pinned": "true"}` or include `title` in the PATCH body. Expect `400` and no state change.
8. Confirm the existing create, list, and delete controls still work.

## Logging and traceability

The backend logs safe operation metadata for successful and invalid note creation/pin updates: event name, operation, outcome, note ID when resolved, and duration. It does not log passwords, JWTs, request bodies, note contents, or validation details. The former registration-password debug print was removed.

See `docs/ai-engineering-log.md` for the observable development phases, commands, decisions, failures, fixes, and verification evidence. No private model reasoning is claimed or captured.

## Actual verification results

- Frontend unit tests: passed — 1 file, 6 tests.
- Frontend production build: passed.
- Django system check: passed with no issues.
- Python syntax compilation: passed for changed backend modules, tests, and migration.
- Offline Django migration consistency check: passed with no pending model changes.
- Project-wide frontend lint: not clean because of 7 existing errors and 1 warning outside the pinning files.
- Django API tests, migration application, live API calls, database persistence, browser demonstration, and live log observation: not run because the authorized PostgreSQL environment is unavailable.

## Known limitations and next steps

- PostgreSQL configuration and an isolated test database are required before claiming backend test or end-to-end success.
- npm reported dependency audit findings during setup. No automatic dependency upgrade was applied because it could introduce unrelated or breaking changes.
- The backend logs safe structured fields through standard Python logging, but no global JSON log formatter or correlation-ID middleware was added.
- `frontend/src/components/ProtectedRoute.jsx` has a pre-existing `console.log(error)` in its token-refresh error path. It is outside this feature's changed code but should be sanitized in a separate security cleanup because Axios errors can contain request metadata.
- Pin filtering, server-side pin ordering, bulk actions, pin timestamps, and pin audit history are out of scope.

## Interview questions and concise answers

### Why use `PATCH` instead of a separate pin endpoint?

Pinning changes one field of an existing note resource. `PATCH /api/notes/{id}/` is smaller and more REST-aligned than creating an action endpoint, while a dedicated serializer keeps the mutation narrow.

### How is another user's note protected?

The view filters its queryset with `author=request.user` before object lookup. A foreign ID is therefore indistinguishable from a missing one and returns `404`.

### How does pin state persist after a refresh?

The boolean is stored in PostgreSQL and serialized by `GET /api/notes/`. The frontend reloads that server state when the page mounts.

### Why avoid an optimistic UI update?

The UI only reflects the saved API response, so a validation, authorization, or network failure cannot falsely present a pin state that the server did not persist.

### What was AI-assisted, and what was verified?

AI assistance was used to inspect code, propose the smallest secure design, implement the change, and generate focused tests and documentation. The activity log separates those observable changes from verified command results and from PostgreSQL-dependent checks that remain blocked.

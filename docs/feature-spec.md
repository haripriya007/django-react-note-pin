# Feature Specification: Pin and Unpin Notes

## Objective

Allow an authenticated user to mark one of their notes as important and later remove that mark. The pinned state must be stored in PostgreSQL, returned by the existing notes API, and shown in the React notes interface after a successful server response.

## Current problem and proposed solution

The application lets authenticated users create, list, and delete only their own notes, but it provides no way to identify an important note. A pin state lets users distinguish those notes without changing their title or content.

The solution adds an `is_pinned` flag to the existing `Note` model and uses an authenticated partial update of an individual note resource. The existing list/create and delete endpoints remain unchanged.

## User stories and acceptance criteria

### User stories

- As an authenticated note owner, I can pin one of my notes so it is clearly marked as pinned.
- As an authenticated note owner, I can unpin a pinned note.
- As an authenticated user, I see the same pinned state after refreshing the page or signing in again.
- As a user, I receive useful feedback while a pin request is pending or fails.

### Acceptance criteria

1. A newly created and all existing notes have `is_pinned: false` unless explicitly changed by their owner.
2. An authenticated owner can send `PATCH /api/notes/{id}/` with `{"is_pinned": true}` to pin a note and with `false` to unpin it.
3. The successful response represents the saved database state; the UI updates only from that response.
4. The notes list includes `is_pinned` for every returned note, so the state survives refresh and a later sign-in.
5. Pinned notes are visibly distinguishable and expose their state to assistive technology.
6. A note owned by another user is not accessible through the pin endpoint and returns the application's normal not-found response.
7. Missing or invalid JWT authentication is rejected by the existing DRF JWT rules.
8. Invalid pin requests receive useful 400-series responses and do not change the saved value.
9. Existing note creation, listing, and deletion continue to work.
10. Backend tests, migration checks, lint/build checks, and documented manual verification are completed or their actual blockers are recorded.

## Expected UI behavior

`Home.jsx` remains the source of the notes collection and fetches the current server state through `GET /api/notes/`. Each `Note` card receives a pin-toggle callback and displays:

- a button labelled **Pin note** when `is_pinned` is false, and **Unpin note** when it is true;
- `aria-pressed` reflecting the current saved state;
- a visible pinned badge or equivalent state-specific styling; and
- a disabled, descriptive busy state while that note's request is in flight.

On activation, the client sends one `PATCH` request. Duplicate requests for the same note are prevented while the request is pending. On a 200 response, `Home.jsx` replaces that note in state with the returned note object and presents a non-blocking success message. On failure, it preserves the previous saved state, re-enables the control, and presents an accessible error message with a retry path. The empty state, creation form, and delete behavior remain intact.

The implementation preserves the current list ordering rather than silently changing it to put pinned notes first. Pinning is conveyed by the badge and styling; a later product decision could add server-side ordering or filtering.

## API contract

### List notes

`GET /api/notes/`

Authentication: `Authorization: Bearer <access-token>`.

Success response (`200 OK`):

```json
[
  {
    "id": 7,
    "title": "Prepare interview demo",
    "content": "Show pin and unpin behavior.",
    "created_at": "2026-10-26T10:00:00Z",
    "author": 3,
    "is_pinned": true
  }
]
```

### Set pinned state

`PATCH /api/notes/{id}/`

Authentication: `Authorization: Bearer <access-token>`.

Request body:

```json
{
  "is_pinned": true
}
```

Success response (`200 OK`): the complete saved note representation, including `is_pinned`.

```json
{
  "id": 7,
  "title": "Prepare interview demo",
  "content": "Show pin and unpin behavior.",
  "created_at": "2026-10-26T10:00:00Z",
  "author": 3,
  "is_pinned": true
}
```

### Validation and error responses

- `400 Bad Request`: body is missing `is_pinned`, the value is not a JSON boolean, or the request contains a field outside the pin-update contract. The response follows DRF serializer-error format, for example `{"is_pinned": ["Must be a valid boolean."]}`.
- `401 Unauthorized`: JWT is missing, invalid, or expired, following the configured SimpleJWT/DRF behavior.
- `404 Not Found`: the note does not exist or does not belong to the authenticated user. Returning 404 avoids revealing another user's note identifier.
- `405 Method Not Allowed`: a non-PATCH request is sent to the pin-update route.

The server derives ownership from `request.user`; it never accepts an author or owner identifier from the client. A dedicated update serializer accepts only `is_pinned`, preventing the pin endpoint from becoming an undocumented title/content or ownership update endpoint. The response may use the existing complete `NoteSerializer` after saving.

## Database change and migration plan

Add this field to `api.Note`:

```python
is_pinned = models.BooleanField(default=False)
```

`api/migrations/0002_note_is_pinned.py` was generated with Django 5.2.8's migration autodetector. It adds a non-null boolean column with a database default of `false`, allowing all existing rows to remain valid and unpinned. No table drop, data deletion, or author reassignment is required. Reversing the migration removes the new column and would discard only pin-state data; rollback must therefore be an explicit development or deployment decision.

## Authentication, authorization, and security

The project continues to use `JWTAuthentication` and `IsAuthenticated`. The update view queryset is filtered by `author=request.user`, matching the existing list and delete views. This provides ownership isolation at object lookup, including for direct URL access.

The feature does not log passwords, JWTs, authorization headers, full request bodies, note contents, or user email addresses. The existing registration password debug print was removed during setup. Feature logging records safe operational metadata such as event name, operation, outcome, note identifier when available, and duration. No correlation ID middleware or logging platform was added; the existing logging configuration can be extended later to render those safe fields as JSON. Exceptions are logged server-side without returning tracebacks to the client.

## Error handling and accessibility

- Server validation is authoritative; client-side behavior does not claim success before the API returns 200.
- Client error and success messages are announced with an appropriate live region and are not conveyed by color alone.
- The pin control is a semantic `button`, works with keyboard activation, has a stateful accessible label, and is disabled during its own request.
- Failed requests leave the last confirmed state unchanged and make retry possible.

## Testing strategy

### Django tests

Implemented focused tests using Django's existing test runner and DRF API client for:

1. Default `is_pinned=False` for a newly created note.
2. Authenticated pin and unpin requests, including the response representation and database persistence after refresh from the database.
3. Rejection of unauthenticated requests.
4. Ownership isolation: a second user receives 404 and the owner's stored flag is unchanged.
5. Invalid/missing/non-boolean input and unexpected writable fields.
6. Regression coverage for authenticated create, list (scoped to the current user), and delete operations.
7. Migration consistency with `python manage.py makemigrations --check --dry-run`.

### React tests

The repository had no frontend test command or test dependencies. A minimal Vite-compatible setup was added with Vitest, React Testing Library, `@testing-library/jest-dom`, jsdom, and deterministic DOM cleanup. Six passing unit tests cover visible pinned/unpinned state, button label and `aria-pressed`, successful pinning, successful unpinning, disabled in-flight state/duplicate prevention, failure, and retry. API responses are mocked only in these isolated unit tests.

### PostgreSQL test environment

The checked-in settings require these environment variables for PostgreSQL: `DB_NAME`, `DB_USER`, `DB_PWD`, and `DB_HOST`; `DB_PORT` defaults to `5432`. Django also requires an application `SECRET_KEY`. A development-only `DEBUG=True` and correctly configured local frontend CORS origin may be needed to run the two servers together.

Tests must use an authorized, isolated development PostgreSQL database—not the deployed or production database. With the current settings, Django's test runner derives an ephemeral database named `test_<DB_NAME>` and creates and destroys it through the configured PostgreSQL role. That role must be able to connect to the development server and create test databases. Credentials and database names are not included in this specification and must be supplied through an approved local secret-management process. Run `python manage.py test api` only after confirming that target is isolated.

## Affected files

Implemented feature changes:

- `backend/api/models.py` — add `is_pinned`.
- `backend/api/migrations/0002_note_is_pinned.py` — non-destructive schema migration generated by Django.
- `backend/api/serializers.py` — return the pin field and add a restricted pin-update serializer.
- `backend/api/views.py` — authenticated, owner-scoped partial update and safe operational logging.
- `backend/api/urls.py` — add the individual-note PATCH route.
- `backend/api/tests.py` — model, API, validation, permission, and regression tests.
- `frontend/src/pages/Home.jsx` — request/state/loading/error behavior.
- `frontend/src/components/Note.jsx` and `frontend/src/styles/Note.css` — pin control and visual state.
- `frontend/package.json`, `frontend/vite.config.js`, `frontend/src/test/setup.js`, and `frontend/src/pages/Home.test.jsx` — minimal frontend test setup and unit coverage.
- `docs/ai-engineering-log.md` and `docs/demo-guide.md` — actual implementation evidence and demonstration instructions.

## Completion and demonstration criteria

The implementation, frontend tests, production build, Django system check, and offline migration consistency check are complete. Actual migration application, Django API tests, live browser/API verification, and reload persistence verification remain blocked until an authorized isolated PostgreSQL environment is configured. The frontend lint command still reports pre-existing errors in unrelated files; no pinning-file lint errors remain.

## Assumptions and out of scope

- One note can be either pinned or unpinned; there is no limit on pinned notes.
- Pinning does not change note content, title, author, creation time, or default list order.
- Pin filtering, sorting, bulk pinning, pin timestamps, collaboration, and audit-history storage are out of scope.
- No production configuration, credentials, or remote database will be modified.

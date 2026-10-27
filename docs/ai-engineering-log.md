# AI Engineering Activity Log

## Phase 1 — Local repository setup and security review

### Task and outcome

Prepared the approved public repository in the previously empty workspace without altering its history or pushing any changes. Confirmed that the checked-out local source matches the inspected remote baseline and identified the local PostgreSQL dependency blocker.

### Observable actions and evidence

- Added the approved repository as `origin`, fetched it, and checked out `main` tracking `origin/main` at commit `9e430160610c1a920fbed8f538d6332cfeeab386`.
- Inspected the local Django, DRF, React, migration, API route, and note UI source files.
- Confirmed that Django settings use `django.db.backends.postgresql` and read database connection configuration from environment variables.
- Checked only whether the required configuration variable names were available; no values, credentials, tokens, or secrets were read or recorded.
- Found no local `.env` files, no available PostgreSQL client, and no local service listening on port 5432. Backend database-dependent checks cannot run until an authorized PostgreSQL connection is supplied.

### Security fix

**Verified fact:** `backend/api/serializers.py` printed `validated_data` in `UserSerializer.create()`. For registration, that data includes the submitted password.

**Change made:** Removed that `print` statement. No replacement log was added because successful registration does not require logging user-supplied credentials or other personal data. This preserves the existing user-creation behavior while preventing password disclosure through application logs.

### Scope and remaining limitations

No note-pinning feature work, migration, dependency installation, test execution, commit, or push has been performed. The next work remains blocked on the approved Phase 2 checkpoint and, for database-backed verification, PostgreSQL configuration or an authorized local service.

## Phase 2 — Pin and unpin requirements specification

### Task and outcome

Created `docs/feature-spec.md` before implementation. The specification defines the feature behavior, API contract, migration plan, security boundaries, accessibility requirements, test strategy, PostgreSQL test-environment constraints, and completion criteria.

### Decisions made

- Use `PATCH /api/notes/{id}/` for an owner-scoped partial update rather than a separate action endpoint. It keeps the operation on the existing note resource while limiting the update payload to `is_pinned`.
- Keep the current notes list ordering. A pinned badge and state-specific styling meet the feature requirement without an unrelated behavior change.
- Update React state only from a successful server response; requests for the same note are disabled while pending.
- Use the current JWT and owner-filtered queryset pattern. Other users receive 404 rather than any information about a note they do not own.
- Require isolated PostgreSQL test-database access before database-dependent test execution. No credentials have been requested, read, or recorded.

### Files inspected or changed

- Added `docs/feature-spec.md`.
- Updated this activity log.
- Relied on the already-inspected local `Note` model, serializers, views, routes, settings, React note page and card, dependency manifests, migration, and test scaffold. No application source or dependency manifest was changed in this phase.

### Validation and remaining limitations

- The specification was written against the checked-out `main` baseline and its PostgreSQL configuration.
- No migration, API route, UI control, test dependency, automated test, commit, or push has been added or run.
- PostgreSQL configuration remains unavailable locally, so the future test database and end-to-end flow cannot yet be verified.

## Phase 3 — Git safety and feature branch preparation

### Task and outcome

Inspected the complete current working-tree state and created the isolated `feature/note-pinning` branch from the approved baseline commit. Branch creation preserved all uncommitted work.

### Verified Git state

- Baseline commit: `9e430160610c1a920fbed8f538d6332cfeeab386` (`Update settings.py`).
- Baseline branch before creation: `main`, tracking `origin/main`.
- Feature branch: `feature/note-pinning`, created at the same baseline commit.
- Remote: `https://github.com/dev-kelz/Django-React-Full-Stack-App-main.git` for fetch and push. This is the original public repository, not a user fork.
- Pre-existing intentional working-tree changes were retained: the password-log removal in `backend/api/serializers.py`, plus `docs/ai-engineering-log.md` and `docs/feature-spec.md`.

### Validation and safety decisions

- Ran `git status --short --branch`, inspected the tracked diff, listed untracked documentation files, and ran `git diff --check` before changing branches.
- Did not reset, stash, discard, overwrite, stage, commit, configure a push target, or push changes.
- Branch creation is safe for this state because Git preserves uncommitted tracked and untracked files when switching to a new branch that does not conflict with them.

### Remaining limitations

The feature branch has no upstream configured and no push will be attempted. Remote publication requires a user-owned or otherwise authorized fork and explicit approval. PostgreSQL access remains unavailable for future database-backed validation.

## Phase 4 — Django model, API, logging, and backend tests

### Task and outcome

Implemented the approved backend portion of note pinning on `feature/note-pinning`. The change adds a persisted pin flag, an authenticated owner-scoped PATCH endpoint, safe operational logs, and automated API/regression test coverage.

### Files changed

- `backend/api/models.py` — added `Note.is_pinned` as a boolean defaulting to `False`.
- `backend/api/migrations/0002_note_is_pinned.py` — additive Django 5.2.8-generated migration depending on `0001_initial`.
- `backend/api/serializers.py` — exposed `is_pinned` in normal note representations and added a restricted pin-update serializer. It accepts a JSON boolean only and rejects fields other than `is_pinned`.
- `backend/api/views.py` — added `NotePinUpdate` for `PATCH /api/notes/{id}/`; its queryset is scoped to the authenticated owner. Replaced the note-creation `print(serializer.errors)` path with safe success/validation-failure operational logs.
- `backend/api/urls.py` — added the named individual-note pin-update route.
- `backend/api/tests.py` — added pin/unpin, persistence, authentication, ownership, validation, and create/list/delete regression tests.
- `.gitignore` — added standard Python bytecode rules after local syntax checks generated cache artifacts; this prevents generated `.pyc` files from entering the feature diff.

### Design and security decisions

- The pin endpoint uses `GenericAPIView` with `IsAuthenticated` and `Note.objects.filter(author=request.user)`. A foreign note therefore resolves as 404 and cannot be changed.
- `NotePinSerializer` has no owner, title, or content fields. Its update method writes only `is_pinned` with `update_fields=["is_pinned"]`.
- Boolean input is deliberately strict: JSON `true` and `false` are accepted; string values such as `"true"` are rejected.
- The replacement logs contain event name, operation, outcome, note identifier when a note was resolved, and elapsed milliseconds. They do not include passwords, JWTs, authorization headers, note content, request bodies, or raw validation errors.

### Commands and verified outcomes

- Created an ignored `backend/venv` and installed `backend/requirements.txt`; verified Django `5.2.8` and DRF `3.16.1`. The first install attempt encountered a transient Windows file lock and succeeded on retry.
- `python -m py_compile` for the changed backend modules and migration completed successfully.
- `python manage.py check` completed successfully with `System check identified no issues (0 silenced).` A random, process-only development `SECRET_KEY` was generated for this command; it was not written to disk or logged.
- Django 5.2.8's offline migration autodetector generated `0002_note_is_pinned` and, after adding it, reported no pending model changes.
- Direct serializer checks verified acceptance of `{"is_pinned": true}` and rejection of a string boolean or a payload containing `title`.

### Problems and limitations

- Initial management-command execution failed because the local environment lacks `SECRET_KEY`; this was resolved for non-database checks with a process-only random value.
- Migration generation and `showmigrations --plan` management commands then waited on the absent PostgreSQL service because Django checks migration history against the configured database. Those exact management-command processes were stopped without changing data. The generated migration was instead obtained through Django 5.2.8's offline migration autodetector, which does not contact the database.
- A mistaken removal of the `User` import during view cleanup caused `CreateUserView` import failure; it was immediately restored before migration generation.
- `python manage.py test api` and actual migration application were not run because no authorized PostgreSQL configuration or isolated test database is available. They must be run only after the approved development database service and credentials are supplied.
- The environment prevented deletion of the local generated bytecode artifacts. Tracked cache files were restored to their verified baseline, and the new ignore rules keep the remaining local-only artifacts out of Git status and review.

### Human review points

- Review whether the application logging formatter should emit the safe `extra` fields as structured JSON; no logging dependency or global configuration was added for this scoped feature.
- Before running database-backed verification, confirm the target is an isolated development database and that the PostgreSQL role may create Django's `test_<DB_NAME>` database.

## Phase 5 — React pinning UI and frontend tests

### Task and outcome

Implemented the React portion of note pinning against the real authenticated Axios client. Added a small Vitest and React Testing Library setup because the repository had no existing frontend test command or test framework.

### Files changed

- `frontend/src/pages/Home.jsx` — sends `PATCH /api/notes/{id}/` with only `is_pinned`, replaces local note state only from a successful response, prevents duplicate requests with a per-note in-flight guard, and renders accessible success/error feedback.
- `frontend/src/components/Note.jsx` — adds a stateful Pin/Unpin button, `aria-pressed`, a descriptive busy label, disabled conflicting actions while a pin update is pending, pinned badge/style hook, and prop validation.
- `frontend/src/styles/Note.css` and `frontend/src/styles/Home.css` — add pinned-state, control, busy, success, and error styles without redesigning the existing layout.
- `frontend/package.json` and `frontend/package-lock.json` — add the `test` script plus Vitest, jsdom, React Testing Library, jest-dom, and `prop-types`.
- `frontend/vite.config.js` and `frontend/src/test/setup.js` — configure a jsdom test environment and deterministic DOM cleanup.
- `frontend/src/pages/Home.test.jsx` — adds isolated API-mocked unit coverage for rendered pin states, successful pin/unpin, pending state/duplicate prevention, failure, and retry.

### Design and security decisions

- Production code uses the existing `api` Axios instance, which already attaches the JWT authorization header; test mocks are isolated to the unit-test file.
- The client does not optimistically alter pin state. It replaces a note only with the API response after a successful request.
- The action uses semantic buttons, keyboard-native interaction, `aria-pressed`, a busy accessible label, and live-region messages. Failure retains the confirmed server state and enables retry.
- The existing debug `console.log` for fetched notes was removed. No credentials, tokens, or request bodies are logged by the frontend feature.

### Commands and verified outcomes

- Installed the minimal test dependencies with npm; the first install process completed after a bounded wait.
- `npm test` passed: 1 test file and 6 tests passed.
- `npm run build` passed and generated the Vite production bundle.
- `npm run lint` was executed. The initial run found one new redundant boolean conversion and existing project-wide lint failures. The new issue was fixed; the final run reports only 7 existing errors and 1 existing warning in `server.js`, `App.jsx`, `Form.jsx`, `ProtectedRoute.jsx`, and `NotFound.jsx`. No lint failures remain in the modified pinning code.

### Problems and limitations

- The first frontend test run exposed missing DOM cleanup between tests and an imprecise busy button label. Added `afterEach(cleanup)` and an `Updating pin status` accessible label; the rerun passed all tests.
- npm reported 27 dependency audit findings after installation. No automated audit fix was run because it could introduce unrelated or breaking dependency changes; this is a follow-up review item.
- Browser-level and live API verification remain blocked by the unavailable authorized PostgreSQL backend configuration. The frontend unit tests use mocked API responses only within the test environment, as intended.

## Phase 6 — End-to-end integration verification

### Integrated contract review

Reviewed the feature diff across model, migration, serializers, views, routes, Axios usage, and React state handling. The contract is consistent:

- `Note.is_pinned` and migration `0002_note_is_pinned` define an additive non-null boolean with `default=False`.
- `PATCH /api/notes/{id}/` resolves through `NotePinUpdate`; its queryset is filtered to `author=request.user` and its serializer accepts only a strict boolean `is_pinned` field.
- The endpoint returns the complete `NoteSerializer` representation, including `is_pinned`, matching the frontend replacement state.
- `Home.jsx` sends only `{ "is_pinned": nextPinnedState }` through the existing Axios client at the same endpoint and retains the saved state when a request fails.
- Existing list/create/delete paths remain unchanged. The expanded note representation includes the new field, which the existing React list can consume.

### Commands and verified outcomes

- `git diff --check` passed.
- `npm test -- --reporter=verbose` passed: 1 test file and 6 tests, covering pin/unpin rendering and request behavior, success, busy state, failure, and retry.
- `npm run build` passed with Vite production output.
- `python -m py_compile` passed for the changed backend modules, tests, and migration.
- `python manage.py check` passed: `System check identified no issues (0 silenced).` A random process-only development `SECRET_KEY` was used and not recorded.
- Django 5.2.8 offline migration autodetection passed with no pending model changes.
- Django checks regenerated tracked bytecode cache artifacts; those exact cache files were restored to their pre-verification baseline and remain outside the intended feature diff.

### Database availability and blocked verification

Checked configuration availability without reading values: `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PWD`, and `DB_HOST` are unavailable. No local service responds on PostgreSQL port 5432.

Therefore, actual database migration application, `python manage.py test api`, authenticated live PATCH requests, reload persistence, ownership isolation through a running service, and browser end-to-end verification were **not run**. No credentials were invented and no production configuration was changed.

To complete those checks, configure an authorized local development PostgreSQL service and process environment with `SECRET_KEY`, `DB_NAME`, `DB_USER`, `DB_PWD`, and `DB_HOST` (optionally `DB_PORT`). Confirm the database is isolated from production and that the role can create Django's `test_<DB_NAME>` database. Then run `python manage.py migrate`, `python manage.py test api`, start `python manage.py runserver`, and use the frontend with `VITE_API_URL` pointing to that local server.

### Scenario status

- Frontend unit-level pin, unpin, pending/duplicate prevention, failure, retry, and server-response state replacement: passed.
- Backend model/API/authorization/persistence/regression scenarios: automated tests written but blocked from execution by PostgreSQL.
- Full authenticated browser/API/database journey: blocked by PostgreSQL configuration.

### Remaining concerns

- The project-wide frontend lint command remains blocked by pre-existing issues outside the pinning files, as recorded in Phase 5.
- npm reported dependency audit findings during test-tool setup; no automatic upgrade was applied to avoid unrelated breaking changes.
- No live structured-log output could be observed without a running backend, although the safe logging paths were reviewed statically.

## Final review — security, scope, and delivery readiness

### Security and code review findings

- Authentication: the feature continues to rely on the project's JWT Axios interceptor and DRF `IsAuthenticated` permission.
- Authorization: the pin-update lookup is owner-scoped with `author=request.user`; its restricted serializer cannot update author, title, or content.
- Validation: only JSON booleans are accepted for `is_pinned`; missing, string, and extra-field requests are rejected before a database write.
- Migration safety: the generated migration is additive with `default=False`; it preserves existing note rows and does not delete data.
- Logging: the feature's backend logs exclude credentials, request bodies, note content, and raw validation errors. The unsafe registration password print and the note-create print were removed.
- Accessibility: the pin control is a semantic button with state, busy, and feedback semantics; the busy state blocks duplicate/conflicting actions.
- Regression protection: focused backend API/regression tests and six frontend unit tests are present. Backend test execution remains blocked by PostgreSQL availability.
- Secret scan: no common private-key, cloud-key, GitHub-token, or OpenAI-key patterns were found in the workspace changes.

### Outstanding repository concerns

- `frontend/src/components/ProtectedRoute.jsx` contains a pre-existing `console.log(error)` in the token-refresh error path. Axios error objects can include request metadata, so this should be removed or sanitized in a separately scoped security cleanup.
- Project-wide frontend lint remains blocked by pre-existing errors outside the pinning implementation.
- npm audit findings and unavailable PostgreSQL-backed verification remain open as previously documented.

### Final delivery status

The feature is ready for review on `feature/note-pinning` with no commit or push. The intended diff contains only the pinning feature, its test setup, safe logging cleanup, documentation, and Python bytecode ignore rules. Database-backed confirmation requires an authorized isolated PostgreSQL environment.

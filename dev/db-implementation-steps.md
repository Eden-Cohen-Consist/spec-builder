# System Expansion Plan

Database schema: `dev/newDB.md`.

Complete and verify one phase before starting the next. Every phase must leave the current application usable.

## Phase 1: Containerize the existing application

Goal: run the application consistently without changing its behavior.

- [ ] Add a production Dockerfile for the server.
- [ ] Add a production Dockerfile for the client.
- [ ] Add Docker Compose for local development.
- [ ] Configure environment variables and secrets.
- [ ] Add container health checks.
- [ ] Verify the complete wizard and Claude chat through Docker.

Keep one server replica while usage remains in `usage.json`.

**Complete when:** the existing application works through Docker exactly as it does today.

## Phase 2: Deploy the existing application to Azure

Goal: prove the container and network setup before adding persistence.

- [ ] Deploy the client and server containers.
- [ ] Configure Kubernetes Service and Ingress.
- [ ] Configure the Anthropic secret and server environment.
- [ ] Verify health checks, API proxying, SSE streaming, and client disconnects.
- [ ] Verify the complete wizard and Claude chat in Azure.

**Complete when:** the current application works in Azure without database or authentication changes.

## Phase 3: Prove Azure authentication forwarding

Goal: determine exactly how Azure identifies a logged-in user to the server.

- [ ] Put the application behind the existing Azure authentication layer.
- [ ] Inspect the forwarded headers or token safely.
- [ ] Define the stable external user identifier and expected identity fields.
- [ ] Add identity middleware that normalizes those fields.
- [ ] Add `GET /api/me` for verification.
- [ ] Remove temporary identity diagnostics after verification.
- [ ] Keep a fixed local identity for Docker development only.

No database writes yet.

**Complete when:** `/api/me` returns the correct identity for a real Azure user.

## Phase 4: Add the complete database foundation

Goal: build and verify the server-side database layer without changing current client behavior.

- [ ] Create the tables from `dev/newDB.md` in Azure PostgreSQL.
- [ ] Add PostgreSQL to Docker Compose for local development.
- [ ] Add server database configuration and connection pooling.
- [ ] Add migrations or another repeatable schema-versioning process.
- [ ] Add repositories for users, specs, chat sessions, chat messages, and AI usage.
- [ ] Add services above repositories for business operations and transactions.
- [ ] Add a DB readiness check.
- [ ] Add repository integration tests.

The wizard still uses `localStorage`, chat history still comes from the client, and usage still goes to `usage.json`.

**Complete when:** all tables and repository operations work locally and in Azure while existing application behavior remains unchanged.

## Phase 5: Connect users and enforce identity

Goal: connect authenticated identities to database users.

- [ ] Find or create a user by `external_auth_id`.
- [ ] Update email, name, and `last_login_at`.
- [ ] Attach the database user to every authenticated request.
- [ ] Reject disabled users.
- [ ] Use the user ID as the API rate-limit key.
- [ ] Verify local fixed identity and Azure identity use the same application flow.

**Complete when:** every request has a verified database user and the existing wizard and chat still work.

## Phase 6: Move specs to the database

Goal: support multiple persistent specs per user.

- [ ] Add specs CRUD API.
- [ ] Restrict every spec query to the current user.
- [ ] Add the client specs list: create, open, rename, and delete.
- [ ] Load the selected spec into the existing wizard.
- [ ] Autosave wizard data to the server.
- [ ] Keep `localStorage` during verification, then remove draft writes from it.
- [ ] Verify multiple specs survive refresh and container restarts.

**Complete when:** each user can manage multiple private specs and the full wizard still works.

## Phase 7: Move chat history and final specs to the database

Goal: make step 4 persistent and server-owned.

- [ ] Create or load a chat session for the selected spec.
- [ ] Save user and assistant messages.
- [ ] Load Claude history from the database instead of trusting client history.
- [ ] Save final Markdown and completion time on the spec.
- [ ] Restore chat messages and the final download card when reopening a spec.
- [ ] Handle failed and aborted streams without saving incomplete assistant messages.

**Complete when:** a user can leave step 4, return later, and continue from persisted state.

## Phase 8: Move AI usage to the database

Goal: replace the single-instance JSON usage store.

- [ ] Insert one `ai_usage` row for every completed Claude turn.
- [ ] Save all planned token columns and raw Anthropic `usage` JSON.
- [ ] Keep `user_id`; allow deleted specs and sessions to become null through `ON DELETE SET NULL`.
- [ ] Compare database records with `usage.json` during verification.
- [ ] Stop writing `usage.json` after verification.
- [ ] Verify the server can safely run multiple replicas.

No quota logic in this phase.

**Complete when:** usage analytics data is complete in PostgreSQL and no application state depends on local files.

## Phase 9: Add administration

Goal: manage users and inspect usage.

- [ ] Add admin authorization middleware.
- [ ] Add APIs to list users and update role or status.
- [ ] Add usage reporting APIs.
- [ ] Add a separate Hebrew admin dashboard.
- [ ] Verify normal users cannot access admin APIs or UI.

**Complete when:** an admin can manage users and inspect usage without affecting the spec workflow.

## Phase 10: Production hardening and scaling

Goal: make the completed system safe to operate with multiple replicas.

- [ ] Configure production database pool limits and TLS.
- [ ] Add graceful shutdown for HTTP and database connections.
- [ ] Add structured logs with user, spec, and chat session identifiers.
- [ ] Configure Kubernetes readiness, liveness, resource limits, and secrets.
- [ ] Run multiple server replicas.
- [ ] Test restart recovery, concurrent saves, stream interruption, and database outages.

**Complete when:** the application remains correct during scaling, restarts, and expected infrastructure failures.

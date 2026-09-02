# Backend Simplification Design

## Goal

Refactor the Express backend into a conventional, readable structure without changing the chat API behavior.

## Structure

```text
server/src/
  config/
    env.ts
    claude.ts
  controllers/
    chatController.ts
  middleware/
    errorHandler.ts
    rateLimit.ts
  routes/
    index.ts
    chat/
      index.ts
  schemas/
    chatSchema.ts
    finalSpecTool.ts
  services/
    claudeService.ts
    usageService.ts
  types/
    index.ts
  server.ts
```

`server.ts` creates the Express app, registers global middleware, mounts the API router at `/api`, and starts listening. `routes/index.ts` mounts each resource router with `router.use`. The chat router exposes `POST /api/chat`.

## Modules

- `config/env.ts` loads dotenv and exports plain typed values with defaults. It does not use Zod.
- `config/claude.ts` creates and exports the Anthropic SDK client and Claude request settings.
- `chatController.ts` exports a normal Express request handler. It validates the endpoint body, manages SSE headers and disconnects, calls the service, records usage, and maps failures to SSE errors.
- `claudeService.ts` exports a `streamChat` async generator function. It uses the official Anthropic SDK and preserves strict final-tool parsing.
- `usageService.ts` exports `logExchange`. It keeps serialized writes and persisted-data sanitization so concurrent requests and malformed files cannot corrupt counters.
- Middleware files export ready-to-use middleware rather than factory functions where configuration is static.

## HTTP Clients

Axios is used for ordinary application HTTP requests. The browser chat request remains on `fetch` because it consumes a POST response as a readable SSE stream, which Axios's browser XHR adapter does not expose equivalently. Claude calls remain on the official Anthropic SDK.

## Preserved Behavior

- `GET /health`
- `POST /api/chat`
- Request validation with Zod at the endpoint boundary
- SSE `text`, `final`, `done`, and `error` events
- Abort provider work when the client disconnects
- Rate limiting
- Claude refusal, token-limit, and invalid-tool handling
- Usage persistence with safe concurrent writes

## Cleanup

Delete `app.ts`, dependency-injection factories, service classes, the unused usage read API, and unnecessary service type exports. Rename dotted files to camelCase names.

## Verification

Add focused tests around route mounting and controller behavior before production edits. Verify the red-green cycle, then run the complete server tests, TypeScript build, client lint, and client build.

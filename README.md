# CollabDraw

CollabDraw is a real-time collaborative whiteboard built as a Bun/Turborepo
monorepo. It includes a Next.js frontend, an HTTP API, a WebSocket server, and
shared TypeScript and Prisma packages.

## Development

Requirements: Bun and PostgreSQL.

1. Install dependencies:

   ```sh
   bun install
   ```

2. Copy the example environment files:

   ```sh
   cp apps/frontend/.env.example apps/frontend/.env.local
   cp apps/http-server/.env.example apps/http-server/.env
   cp apps/ws-server/.env.example apps/ws-server/.env
   ```

3. Configure `DATABASE_URL` for your PostgreSQL database in both server env
   files. Set the same strong `JWT_SECRET` in the HTTP and WebSocket server
   env files.

4. Start the applications:

   ```sh
   bun run dev
   ```

Useful repository commands:

```sh
bun run build
bun run lint
bun run check-types
```

## Authentication sessions

The HTTP server issues JWT access tokens that expire after **three days**.
There is no refresh-token endpoint, so users must sign in again after a token
expires. Changing this lifetime applies to newly issued tokens; existing tokens
keep their original expiry.

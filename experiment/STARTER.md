# Frozen starter record

Do not change `starter/` after official runs begin. Record the git SHA of the commit that contains this tree.

Verified 31 Aug 2026:

- `npm run build` succeeds (`tsc -b && vite build`)
- `npm run dev` serves `http://localhost:8080/` with HTTP 200
- `src/App.tsx` renders nothing (`return null`)
- No login, products, cart, router, or DummyJSON client

Toolchain from `starter/package.json` / lockfile:

- Vite 8.2.2
- React 19.2.8
- TypeScript ~6.0.2
- Port 8080, `strictPort: true`

Operator: copy `starter/`, run `npm ci`, open the agent on that copy only.

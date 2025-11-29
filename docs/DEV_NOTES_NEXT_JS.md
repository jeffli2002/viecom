## Next.js Dev Pitfalls (Viecom)

1. **Do not enable `experimental.optimizePackageImports` in `next.config.ts`.**  
   Next 15.5 does not emit the referenced vendor chunks, so the browser requests `_app-pages-browser_*` files that never exist -> missing chunk errors.

2. **Load Sonner (toast) dynamically on the client.**  
   The `<Toaster />` component must use `next/dynamic` with `ssr: false`. Otherwise it depends on the missing `_app-pages-browser` chunks and hydration fails.

3. **Root routing:**  
   Let `middleware.ts` handle `/` → `/en` redirection. Do not also redirect from `src/app/page.tsx` or you’ll create loops that show “missing required error components.”

4. **When errors persist, delete `.next/` and restart `pnpm dev`.**  
   Old bundles often keep stale diagnostic logs and missing chunks.

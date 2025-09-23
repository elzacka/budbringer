Run npx --no-install next build
⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

  ▲ Next.js 14.2.32

   Creating an optimized production build ...
<w> [webpack.cache.PackFileCacheStrategy] Serializing big strings (108kiB) impacts deserialization performance (consider using Buffer instead and decode when needed)
 ⚠ Compiled with warnings

./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
A Node.js API is used (process.versions at line: 35) which is not supported in the Edge Runtime.
Learn more: https://nextjs.org/docs/api-reference/edge-runtime

Import trace for requested module:
./node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
./node_modules/@supabase/realtime-js/dist/module/index.js
./node_modules/@supabase/supabase-js/dist/module/index.js
./node_modules/@supabase/auth-helpers-shared/dist/index.mjs
./node_modules/@supabase/auth-helpers-nextjs/dist/index.js

./node_modules/@supabase/supabase-js/dist/module/index.js
A Node.js API is used (process.version at line: 24) which is not supported in the Edge Runtime.
Learn more: https://nextjs.org/docs/api-reference/edge-runtime

Import trace for requested module:
./node_modules/@supabase/supabase-js/dist/module/index.js
./node_modules/@supabase/auth-helpers-shared/dist/index.mjs
./node_modules/@supabase/auth-helpers-nextjs/dist/index.js

 ✓ Compiled successfully
   Linting and checking validity of types ...
Failed to compile.

./app/api/admin/prompts/route.ts:90:13
Type error: Argument of type '{ is_active: boolean; }' is not assignable to parameter of type 'never'.

  88 |   const result = await service
  89 |     .from('prompts')
> 90 |     .update({ is_active: parsed.data.active })
     |             ^
  91 |     .eq('id', parsed.data.id);
  92 |
  93 |   if (result.error) {
Next.js build worker exited with code: 1 and signal: null
Error: Process completed with exit code 1.
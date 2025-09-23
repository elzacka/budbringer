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
   Collecting page data ...
   Generating static pages (0/18) ...

Error occurred prerendering page "/admin/api/prompts". Read more: https://nextjs.org/docs/messages/prerender-error

Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at w (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:5175)
    at i (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/recipients/route.js:1:2404)
    at d (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/prompts/route.js:1:1080)
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:38417
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/server/lib/trace/tracer.js:122:103
   Generating static pages (4/18) 

Error occurred prerendering page "/auth/callback". Read more: https://nextjs.org/docs/messages/prerender-error

Error: Route /auth/callback with `dynamic = "error"` couldn't be rendered statically because it used `request.url`.
    at Object.get (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:41748)
    at c (/home/runner/work/budbringer/budbringer/.next/server/app/auth/callback/route.js:1:1074)
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:38417
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
   Generating static pages (8/18) 

Error occurred prerendering page "/admin/api/recipients". Read more: https://nextjs.org/docs/messages/prerender-error

Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at w (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:5175)
    at i (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/recipients/route.js:1:2404)
    at c (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/recipients/route.js:1:1078)
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-route.runtime.prod.js:6:38417
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /home/runner/work/budbringer/budbringer/node_modules/next/dist/server/lib/trace/tracer.js:122:103
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at s (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/recipients/route.js:1:2333)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:7537)
    at i (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:4100)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093) {
  digest: '2728047766'
}
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at s (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/recipients/route.js:1:2333)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:7537)
    at i (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:4100)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093) {
  digest: '2728047766'
}
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at s (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/recipients/route.js:1:2333)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:7537)
    at i (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:4100)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093) {
  digest: '2728047766'
}
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at n (/home/runner/work/budbringer/budbringer/.next/server/app/api/admin/prompts/route.js:1:4318)
    at l (/home/runner/work/budbringer/budbringer/.next/server/app/admin/login/page.js:1:74117)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572) {
  digest: '1810075428'
}
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at n (/home/runner/work/budbringer/budbringer/.next/server/app/api/admin/prompts/route.js:1:4318)
    at l (/home/runner/work/budbringer/budbringer/.next/server/app/admin/login/page.js:1:74117)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572) {
  digest: '1810075428'
}
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at n (/home/runner/work/budbringer/budbringer/.next/server/app/api/admin/prompts/route.js:1:4318)
    at l (/home/runner/work/budbringer/budbringer/.next/server/app/admin/login/page.js:1:74117)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572) {
  digest: '1810075428'
}

Error occurred prerendering page "/admin/login". Read more: https://nextjs.org/docs/messages/prerender-error

Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at n (/home/runner/work/budbringer/budbringer/.next/server/app/api/admin/prompts/route.js:1:4318)
    at l (/home/runner/work/budbringer/budbringer/.next/server/app/admin/login/page.js:1:74117)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572)
Error: r]: Route /unsubscribe with `dynamic = "error"` couldn't be rendered statically because it used `searchParams.email`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering
    at l (/home/runner/work/budbringer/budbringer/.next/server/chunks/276.js:1:36863)
    at Object.get (/home/runner/work/budbringer/budbringer/.next/server/chunks/471.js:2:11871)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/unsubscribe/page.js:1:3856)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '559012942'
}
Error: r]: Route /unsubscribe with `dynamic = "error"` couldn't be rendered statically because it used `searchParams.email`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering
    at l (/home/runner/work/budbringer/budbringer/.next/server/chunks/276.js:1:36863)
    at Object.get (/home/runner/work/budbringer/budbringer/.next/server/chunks/471.js:2:11871)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/unsubscribe/page.js:1:3856)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '559012942'
}
Error: r]: Route /unsubscribe with `dynamic = "error"` couldn't be rendered statically because it used `searchParams.email`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering
    at l (/home/runner/work/budbringer/budbringer/.next/server/chunks/276.js:1:36863)
    at Object.get (/home/runner/work/budbringer/budbringer/.next/server/chunks/471.js:2:11871)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/unsubscribe/page.js:1:3856)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '559012942'
}

Error occurred prerendering page "/unsubscribe". Read more: https://nextjs.org/docs/messages/prerender-error

Error: Route /unsubscribe with `dynamic = "error"` couldn't be rendered statically because it used `searchParams.email`. See more info here: https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering
    at l (/home/runner/work/budbringer/budbringer/.next/server/chunks/276.js:1:36863)
    at Object.get (/home/runner/work/budbringer/budbringer/.next/server/chunks/471.js:2:11871)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/unsubscribe/page.js:1:3856)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
    at eE (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142572)
   Generating static pages (13/18) 

Error occurred prerendering page "/admin". Read more: https://nextjs.org/docs/messages/prerender-error

Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
    at A (/home/runner/work/budbringer/budbringer/.next/server/chunks/958.js:1:4312)
    at s (/home/runner/work/budbringer/budbringer/.next/server/app/admin/api/recipients/route.js:1:2333)
    at a (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:7537)
    at i (/home/runner/work/budbringer/budbringer/.next/server/app/admin/page.js:1:4100)
    at eh (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:134660)
    at e (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:137545)
    at ek (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:138019)
    at Array.toJSON (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:135629)
    at stringify (<anonymous>)
    at eP (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:12:142093)
Error: or]: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '4005043477'
}
Error: or]: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '4005043477'
}

Error occurred prerendering page "/admin/prompts". Read more: https://nextjs.org/docs/messages/prerender-error

Error: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
Error: or]: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '4005043477'
}
Error: or]: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '4005043477'
}
Error: or]: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '4005043477'
}
Error: or]: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373) {
  code: 'NEXT_STATIC_GEN_BAILOUT',
  digest: '4005043477'
}

Error occurred prerendering page "/admin/runs". Read more: https://nextjs.org/docs/messages/prerender-error

Error: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)

Error occurred prerendering page "/admin/recipients". Read more: https://nextjs.org/docs/messages/prerender-error

Error: Page with `dynamic = "force-dynamic"` couldn't be exported. `output: "export"` requires all pages be renderable statically because there is not runtime server to dynamic render routes in this output format. Learn more: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
    at rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:7455)
    at runNextTicks (node:internal/process/task_queues:60:5)
    at listOnTimeout (node:internal/timers:545:9)
    at process.processTimers (node:internal/timers:519:7)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
    at async /home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9536
    at async Promise.all (index 0)
    at async rq (/home/runner/work/budbringer/budbringer/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:9373)
 ✓ Generating static pages (18/18)

> Export encountered errors on following paths:
	/admin/api/prompts/route: /admin/api/prompts
	/admin/api/recipients/route: /admin/api/recipients
	/admin/login/page: /admin/login
	/admin/page: /admin
	/admin/prompts/page: /admin/prompts
	/admin/recipients/page: /admin/recipients
	/admin/runs/page: /admin/runs
	/auth/callback/route: /auth/callback
	/unsubscribe/page: /unsubscribe
Error: Process completed with exit code 1.
# PWA

The web app includes a Next.js web manifest, an SVG app icon, production-only service-worker registration, and a service worker that caches the application shell and the last successful forecast response. The cached forecast keeps its original update time so the interface can identify older cached data.

This is a minimal offline foundation. Installation behavior varies by browser. There is no install prompt, background sync, or push notification implementation yet. Verify service-worker behavior over HTTPS (or localhost) before deployment.

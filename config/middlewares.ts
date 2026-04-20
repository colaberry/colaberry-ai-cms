export default [
  'strapi::logger',
  'strapi::errors',
  // Rate limiting — admin login (brute force protection)
  {
    name: 'global::rate-limit',
    config: {
      name: 'admin-login',
      max: 5,
      windowMs: 60_000, // 5 requests per minute
      pathPrefix: '/admin/login',
    },
  },
  // Rate limiting — SSO OIDC initiation
  {
    name: 'global::rate-limit',
    config: {
      name: 'sso-oidc',
      max: 10,
      windowMs: 60_000, // 10 requests per minute
      pathPrefix: '/strapi-plugin-sso',
    },
  },
  // Rate limiting — telemetry ingestion (tighter limit to prevent flooding)
  {
    name: 'global::rate-limit',
    config: {
      name: 'telemetry',
      max: 20,
      windowMs: 60_000, // 20 requests per minute
      pathPrefix: '/api/mcp-telemetry-events',
    },
  },
  // Rate limiting — podcast log ingestion
  {
    name: 'global::rate-limit',
    config: {
      name: 'podcast-log',
      max: 20,
      windowMs: 60_000, // 20 requests per minute
      pathPrefix: '/api/podcast-logs',
    },
  },
  // Rate limiting — public content API
  // NOTE: `skipAuthenticated: true` means this 100 req/min cap only applies
  // to anonymous/unauthenticated callers (public scrapers, AI crawlers).
  // Server-to-server callers that send `Authorization: Bearer <token>` are
  // exempt — this is required for the nightly mcp-registry-sync job, the
  // buzzsprout-sync scheduler, and the Next.js frontend's server-side
  // fetches to run without being throttled.
  {
    name: 'global::rate-limit',
    config: {
      name: 'content-api',
      max: 100,
      windowMs: 60_000, // 100 requests per minute (unauthenticated only)
      pathPrefix: '/api/',
      skipAuthenticated: true,
    },
  },
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'"],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            'cdn.auth0.com',
            `${process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : ''}`,
          ].filter(Boolean),
          'media-src': ["'self'", 'data:', 'blob:', 'market-assets.strapi.io'],
          'connect-src': [
            "'self'",
            `${process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : ''}`,
          ].filter(Boolean),
          'frame-src': [
            "'self'",
            `${process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : ''}`,
          ].filter(Boolean),
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((s: string) => s.trim())
        : ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      credentials: false,
      keepHeaderOnError: true,
    },
  },
  {
    name: 'strapi::poweredBy',
    config: {
      poweredBy: 'Colaberry',
    },
  },
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

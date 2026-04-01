export default [
  'strapi::logger',
  'strapi::errors',
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

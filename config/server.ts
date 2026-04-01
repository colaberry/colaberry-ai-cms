export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('STRAPI_URL', ''),
  // Trust Cloud Run's load balancer proxy (X-Forwarded-Proto: https)
  // Required for secure cookies in SSO/session middleware
  proxy: env('NODE_ENV', 'development') === 'production',
  app: {
    keys: env.array('APP_KEYS'),
  },
});

export default ({ env }) => ({
  upload: {
    config: {
      sizeLimit: 10 * 1024 * 1024, // 10 MB
      breakpoints: { large: 1000, medium: 750, small: 500 },
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml',
        'application/pdf', 'text/csv', 'text/plain',
      ],
    },
  },
  'strapi-plugin-sso': {
    enabled: true,
    config: {
      // OpenID Connect — Auth0
      OIDC_REDIRECT_URI: env(
        'OIDC_REDIRECT_URI',
        `${env('STRAPI_URL', 'http://localhost:1338').replace(/\/+$/, '')}/strapi-plugin-sso/oidc/callback`,
      ),
      OIDC_CLIENT_ID: env('AUTH0_CLIENT_ID', ''),
      OIDC_CLIENT_SECRET: env('AUTH0_CLIENT_SECRET', ''),
      OIDC_SCOPES: 'openid profile email',
      OIDC_AUTHORIZATION_ENDPOINT: `https://${env('AUTH0_DOMAIN', '')}/authorize`,
      OIDC_TOKEN_ENDPOINT: `https://${env('AUTH0_DOMAIN', '')}/oauth/token`,
      OIDC_USER_INFO_ENDPOINT: `https://${env('AUTH0_DOMAIN', '')}/userinfo`,
      OIDC_USER_INFO_ENDPOINT_WITH_AUTH_HEADER: true,
      OIDC_GRANT_TYPE: 'authorization_code',
      OIDC_FAMILY_NAME_FIELD: 'family_name',
      OIDC_GIVEN_NAME_FIELD: 'given_name',
      // SSO whitelist — restrict admin access to authorized emails only
      USE_WHITELIST: env.bool('SSO_USE_WHITELIST', true),
    },
  },
});

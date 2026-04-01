export default ({ env }) => ({
  upload: {
    config: {
      sizeLimit: 10 * 1024 * 1024, // 10 MB
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
      OIDC_AUTHORIZATION_ENDPOINT: `https://${env('AUTH0_DOMAIN', 'dev-dt7ihdfe4ex718h1.us.auth0.com')}/authorize`,
      OIDC_TOKEN_ENDPOINT: `https://${env('AUTH0_DOMAIN', 'dev-dt7ihdfe4ex718h1.us.auth0.com')}/oauth/token`,
      OIDC_USER_INFO_ENDPOINT: `https://${env('AUTH0_DOMAIN', 'dev-dt7ihdfe4ex718h1.us.auth0.com')}/userinfo`,
      OIDC_USER_INFO_ENDPOINT_WITH_AUTH_HEADER: true,
      OIDC_GRANT_TYPE: 'authorization_code',
      OIDC_FAMILY_NAME_FIELD: 'family_name',
      OIDC_GIVEN_NAME_FIELD: 'given_name',
    },
  },
});

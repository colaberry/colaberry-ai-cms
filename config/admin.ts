export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    // Auth0 SSO configuration (requires Strapi Enterprise Edition)
    // When EE is enabled, admins can log in via Auth0 OpenID Connect.
    // Set AUTH0_ENABLED=true in env to activate SSO.
    ...(env.bool('AUTH0_ENABLED', false) && {
      providers: [
        {
          uid: 'auth0',
          displayName: 'Auth0',
          icon: 'https://cdn.auth0.com/styleguide/components/1.0.8/media/logos/img/badge.png',
          createStrategy: (strapi) => {
            const OpenIDConnectStrategy =
              require('passport-openidconnect').Strategy;
            return new OpenIDConnectStrategy(
              {
                issuer: `https://${env('AUTH0_DOMAIN')}/`,
                authorizationURL: `https://${env('AUTH0_DOMAIN')}/authorize`,
                tokenURL: `https://${env('AUTH0_DOMAIN')}/oauth/token`,
                userInfoURL: `https://${env('AUTH0_DOMAIN')}/userinfo`,
                clientID: env('AUTH0_CLIENT_ID'),
                clientSecret: env('AUTH0_CLIENT_SECRET'),
                callbackURL:
                  env('AUTH0_CALLBACK_URL',
                    `${env('STRAPI_URL', 'http://localhost:1338')}/admin/connect/auth0`),
                scope: ['openid', 'email', 'profile'],
              },
              (
                issuer: string,
                profile: { emails?: { value: string }[]; displayName?: string },
                cb: (err: Error | null, user?: { email: string; firstname: string; lastname: string }) => void,
              ) => {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                  return cb(new Error('Auth0 profile missing email'));
                }
                const [firstname = '', lastname = ''] = (
                  profile.displayName || email.split('@')[0]
                ).split(' ');
                cb(null, { email, firstname, lastname });
              },
            );
          },
        },
      ],
    }),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', false),
    promoteEE: env.bool('FLAG_PROMOTE_EE', false),
  },
});

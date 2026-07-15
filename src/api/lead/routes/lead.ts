/**
 * lead router — CREATE-ONLY.
 *
 * The default core router wires live find/findOne/update/delete handlers, so
 * the entire captured-email table would be one accidental Public-role toggle
 * away from unauthenticated enumeration. Restricting to `create` means those
 * read/mutate routes are never registered at all — defense-in-depth that can't
 * be undone from the admin UI. The site writes leads via a scoped
 * CMS_API_TOKEN (leadStore.ts), which needs only `create`.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::lead.lead', {
  only: ['create'],
});

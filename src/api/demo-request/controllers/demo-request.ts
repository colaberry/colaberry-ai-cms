/**
 * demo-request controller
 *
 * Standard Strapi v5 core controller. Writes are authenticated via the
 * shared CMS_API_TOKEN bearer (same pattern as newsletter-subscriber).
 * The public /api/demo-request endpoint lives in the frontend repo and
 * is the only intended caller for POST/PUT.
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::demo-request.demo-request");

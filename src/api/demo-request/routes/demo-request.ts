/**
 * demo-request router
 *
 * Core router exposing find / findOne / create / update / delete.
 * All routes require bearer-token auth via the CMS_API_TOKEN.
 * The frontend /api/demo-request endpoint is the only intended caller.
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::demo-request.demo-request");

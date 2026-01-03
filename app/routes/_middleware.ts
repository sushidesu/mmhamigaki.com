import { createRoute } from "honox/factory";
import { cacheMiddleware } from "../middleware/cache";

export default createRoute(async (c, next) => {
  return cacheMiddleware()(c, next);
});

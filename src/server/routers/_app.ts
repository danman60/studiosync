import { router } from '../trpc';
import { catalogRouter } from './catalog';
import { registrationRouter } from './registration';
import { adminRouter } from './admin';
import { portalRouter } from './portal';

export const appRouter = router({
  catalog: catalogRouter,
  registration: registrationRouter,
  admin: adminRouter,
  portal: portalRouter,
});

export type AppRouter = typeof appRouter;

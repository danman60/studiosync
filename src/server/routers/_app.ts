import { router } from '../trpc';
import { catalogRouter } from './catalog';
import { registrationRouter } from './registration';
import { adminRouter } from './admin';
import { portalRouter } from './portal';
import { instructorRouter } from './instructor';

export const appRouter = router({
  catalog: catalogRouter,
  registration: registrationRouter,
  admin: adminRouter,
  portal: portalRouter,
  instructor: instructorRouter,
});

export type AppRouter = typeof appRouter;

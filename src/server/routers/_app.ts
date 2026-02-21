import { router } from '../trpc';
import { catalogRouter } from './catalog';
import { registrationRouter } from './registration';

export const appRouter = router({
  catalog: catalogRouter,
  registration: registrationRouter,
});

export type AppRouter = typeof appRouter;

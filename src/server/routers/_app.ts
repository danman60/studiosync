import { router } from '../trpc';
import { catalogRouter } from './catalog';
import { registrationRouter } from './registration';
import { adminRouter } from './admin';
import { portalRouter } from './portal';
import { instructorRouter } from './instructor';
import { invoiceRouter } from './invoice';
import { mediaRouter } from './media';
import { analyticsRouter } from './analytics';
import { eventRouter } from './event';
import { announcementRouter } from './announcement';

export const appRouter = router({
  catalog: catalogRouter,
  registration: registrationRouter,
  admin: adminRouter,
  portal: portalRouter,
  instructor: instructorRouter,
  invoice: invoiceRouter,
  media: mediaRouter,
  analytics: analyticsRouter,
  event: eventRouter,
  announcement: announcementRouter,
});

export type AppRouter = typeof appRouter;

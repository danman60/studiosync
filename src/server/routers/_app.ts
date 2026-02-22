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
import { messagingRouter } from './messaging';
import { tuitionRouter } from './tuition';
import { waiverRouter } from './waiver';
import { promoRouter } from './promo';
import { notificationRouter } from './notification';
import { privateLessonRouter } from './private-lesson';
import { messageTemplateRouter } from './message-template';

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
  messaging: messagingRouter,
  tuition: tuitionRouter,
  waiver: waiverRouter,
  promo: promoRouter,
  notification: notificationRouter,
  privateLesson: privateLessonRouter,
  messageTemplate: messageTemplateRouter,
});

export type AppRouter = typeof appRouter;

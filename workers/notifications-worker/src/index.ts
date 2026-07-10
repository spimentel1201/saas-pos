/**
 * notifications-worker - consume jobs BullMQ de la cola `notifications`.
 *
 *   - `notifications.email`        envio de emails transaccionales.
 *   - `notifications.alert.stock`  alerta de stock minimo a admin/manager.
 */
import { QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

new Worker(
  'notifications',
  async (job) => {
    console.log(`[notifications] job=${job.name} to=${job.data.to}`);
    // TODO: nodemailer.sendMail o plantilla react-email
  },
  { connection, concurrency: 5 },
);

new QueueEvents('notifications', { connection });

console.log('notifications-worker escuchando cola "notifications"...');

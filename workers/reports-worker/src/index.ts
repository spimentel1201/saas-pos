/**
 * reports-worker - consume jobs BullMQ de la cola `reports`.
 *
 *   - `reports.refresh-mv`     refresca MVs (_mv_sales_daily, _mv_inventory_valuation).
 *   - `exports.generate`       genera CSV/Excel/PDF y sube a storage.
 *
 * Proceso separado de la API para no afectar la latencia del POS.
 */
import { QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');

new Worker(
  'reports',
  async (job) => {
    if (job.name === 'reports.refresh-mv') {
      // TODO: REFRESH MATERIALIZED VIEW CONCURRENTLY _mv_sales_daily, _mv_inventory_valuation
      console.log(`[refresh-mv] tenant=${job.data.tenantId}`);
    } else if (job.name === 'exports.generate') {
      // TODO: generar CSV/Excel y devolver signed URL
      console.log(`[exports] tenant=${job.data.tenantId} type=${job.data.type}`);
    }
  },
  { connection, concurrency: 2 },
);

new QueueEvents('reports', { connection });

console.log('reports-worker escuchando cola "reports"...');

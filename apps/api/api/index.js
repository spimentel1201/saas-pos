import { createApp } from '../dist-api/src/vercel.js';

let cachedApp = null;

export default async function handler(req, res) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp(req, res);
}

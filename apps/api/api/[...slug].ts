let cachedApp: any = null;

async function bootstrap() {
  if (cachedApp) return cachedApp;
  const mod = await import('../dist-api/api/index.js');
  cachedApp = mod.default;
  return cachedApp;
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap();
  return (app as any)(req, res);
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as os from 'os';
import { json, urlencoded } from 'express';

function getLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  return '127.0.0.1';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: ['e/:event_id'],
  });

  const port = process.env.APP_PORT || 3000;
  const host = '0.0.0.0';
  const lanIp = getLanIp();

  await app.listen(port, host);
  console.log(`FlashMeet Backend running on http://${lanIp}:${port}`);
  console.log(`  Local:    http://localhost:${port}`);
  console.log(`  LAN:      http://${lanIp}:${port}`);
}
bootstrap();

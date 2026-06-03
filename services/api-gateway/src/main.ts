import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { AppModule } from './app.module';
import { loadMergedOpenApi } from './swagger/swagger-loader';

function shouldSkipProxy(path: string): boolean {
  return (
    path === '/api' ||
    path === '/api/health' ||
    path === '/api/docs' ||
    path === '/api/docs-json' ||
    path.startsWith('/api/docs/') ||
    !path.startsWith('/api/')
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const config = app.get(ConfigService);
  const logger = new Logger('FEMS API Gateway');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  const corsOriginEnv = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const corsOrigin = corsOriginEnv.includes(',')
    ? corsOriginEnv.split(',').map((o) => o.trim())
    : corsOriginEnv;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key'],
  });

  const merged = await loadMergedOpenApi(config, logger);
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(merged, {
      customSiteTitle: 'FEMS API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
        url: '/api/docs-json',
      },
    }),
  );

  const authUrl = config.get('AUTH_SERVICE_URL', 'http://localhost:3001');
  const customerUrl = config.get(
    'CUSTOMER_SERVICE_URL',
    'http://localhost:3002',
  );
  const extinguisherUrl = config.get(
    'EXTINGUISHER_SERVICE_URL',
    'http://localhost:3003',
  );
  const notificationUrl = config.get(
    'NOTIFICATION_SERVICE_URL',
    'http://localhost:3004',
  );
  const renewalUrl = config.get('RENEWAL_SERVICE_URL', 'http://localhost:3005');
  const complianceUrl = config.get(
    'COMPLIANCE_SERVICE_URL',
    'http://localhost:3006',
  );
  const reportUrl = config.get('REPORT_SERVICE_URL', 'http://localhost:3007');

  const routeMap: { prefix: string; target: string }[] = [
    { prefix: '/api/auth', target: authUrl },
    { prefix: '/api/users', target: authUrl },
    { prefix: '/api/customers', target: customerUrl },
    { prefix: '/api/extinguishers', target: extinguisherUrl },
    { prefix: '/api/notifications', target: notificationUrl },
    { prefix: '/api/settings', target: notificationUrl },
    { prefix: '/api/renewals', target: renewalUrl },
    { prefix: '/api/compliance', target: complianceUrl },
    { prefix: '/api/reports', target: reportUrl },
  ];

  const resolveTarget = (req: Request): string => {
    const url = req.originalUrl ?? req.url ?? '';
    for (const route of routeMap) {
      if (url.startsWith(route.prefix)) {
        return route.target;
      }
    }
    return authUrl;
  };

  const proxy = createProxyMiddleware({
    target: authUrl,
    changeOrigin: true,
    router: (req) => resolveTarget(req as Request),
    on: {
      proxyReq: (proxyReq, req) => {
        const auth = (req as Request).headers.authorization;
        if (auth) {
          proxyReq.setHeader('Authorization', auth);
        }
        const serviceKey = (req as Request).headers['x-service-key'];
        if (serviceKey) {
          proxyReq.setHeader('X-Service-Key', serviceKey as string);
        }
      },
      error: (err, req, res) => {
        logger.error(`Proxy error ${req.url}: ${err.message}`);
        if (res && 'writeHead' in res && !(res as Response).headersSent) {
          (res as Response).status(502).json({
            success: false,
            statusCode: 502,
            message: `Service unavailable: ${req.url}`,
          });
        }
      },
    },
  });

  // Register proxy BEFORE Nest routes so POST /api/auth/login is forwarded, not 404'd
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
    if (shouldSkipProxy(req.path)) {
      return next();
    }
    return proxy(req, res, next);
  });

  await app.init();

  for (const route of routeMap) {
    logger.log(`Proxy ${route.prefix} → ${route.target}`);
  }

  const pathCount = Object.keys(merged.paths ?? {}).length;
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`FEMS API Gateway running on http://localhost:${port}`);
  logger.log(`Swagger UI:  http://localhost:${port}/api/docs (${pathCount} endpoints)`);
  logger.log(`OpenAPI JSON: http://localhost:${port}/api/docs-json`);
  logger.log(`Health: http://localhost:${port}/api/health`);
}

bootstrap();

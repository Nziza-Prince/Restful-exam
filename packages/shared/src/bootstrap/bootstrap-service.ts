import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from '../filters/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

export interface BootstrapServiceOptions {
  appModule: unknown;
  serviceName: string;
  defaultPort: number;
}

export async function bootstrapService(
  options: BootstrapServiceOptions,
): Promise<INestApplication> {
  const app = await NestFactory.create(options.appModule as never);
  const config = app.get(ConfigService);
  const logger = new Logger(options.serviceName);

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

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${options.serviceName} API`)
    .setDescription('Fire Extinguisher Management System (FEMS)')
    .setVersion('1.0')
    .addServer(`http://localhost:${options.defaultPort}`, options.serviceName)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from auth-service login',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: `${options.serviceName} — Swagger`,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
    jsonDocumentUrl: 'api/docs-json',
  });

  const port = config.get<number>('PORT', options.defaultPort);
  await app.listen(port);
  logger.log(`${options.serviceName} running on http://localhost:${port}/api`);
  return app;
}

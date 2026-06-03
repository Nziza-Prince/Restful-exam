import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  fetchOpenApiSpec,
  mergeOpenApiDocuments,
  OpenApiDocument,
} from './aggregate-openapi';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EXPECTED_SERVICES = 7;

export async function loadMergedOpenApi(
  config: ConfigService,
  logger: Logger,
): Promise<OpenApiDocument> {
  const services = [
    { name: 'auth', url: config.get('AUTH_SERVICE_URL', 'http://localhost:3001') },
    {
      name: 'customer',
      url: config.get('CUSTOMER_SERVICE_URL', 'http://localhost:3002'),
    },
    {
      name: 'extinguisher',
      url: config.get('EXTINGUISHER_SERVICE_URL', 'http://localhost:3003'),
    },
    {
      name: 'notification',
      url: config.get('NOTIFICATION_SERVICE_URL', 'http://localhost:3004'),
    },
    {
      name: 'renewal',
      url: config.get('RENEWAL_SERVICE_URL', 'http://localhost:3005'),
    },
    {
      name: 'compliance',
      url: config.get('COMPLIANCE_SERVICE_URL', 'http://localhost:3006'),
    },
    {
      name: 'report',
      url: config.get('REPORT_SERVICE_URL', 'http://localhost:3007'),
    },
  ];

  const maxAttempts = 40;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const documents: OpenApiDocument[] = [];

    for (const svc of services) {
      try {
        const doc = await fetchOpenApiSpec(`${svc.url}/api/docs-json`);
        const pathCount = Object.keys(doc.paths ?? {}).length;
        if (pathCount > 0) {
          documents.push(doc);
        }
      } catch {
        // service not ready yet
      }
    }

    const merged = mergeOpenApiDocuments(documents);
    const totalPaths = Object.keys(merged.paths ?? {}).length;

    if (documents.length >= EXPECTED_SERVICES || totalPaths >= 4) {
      merged.servers = [
        { url: 'http://localhost:3000', description: 'API Gateway' },
      ];
      logger.log(
        `OpenAPI merged: ${totalPaths} paths from ${documents.length}/${EXPECTED_SERVICES} services`,
      );
      return merged;
    }

    if (attempt === 1 || attempt % 5 === 0) {
      logger.log(
        `Waiting for microservices OpenAPI (${documents.length}/${EXPECTED_SERVICES} specs, attempt ${attempt}/${maxAttempts})...`,
      );
    }
    await sleep(1000);
  }

  logger.warn(
    'Could not load full OpenAPI from all services — Swagger may be incomplete. Ensure ports 3001–3007 are running, then restart the gateway.',
  );
  const fallback = mergeOpenApiDocuments([]);
  fallback.servers = [
    { url: 'http://localhost:3000', description: 'API Gateway' },
  ];
  return fallback;
}

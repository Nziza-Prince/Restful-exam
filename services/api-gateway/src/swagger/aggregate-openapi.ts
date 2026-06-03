export interface OpenApiDocument {
  openapi?: string;
  info?: Record<string, unknown>;
  servers?: { url: string; description?: string }[];
  paths?: Record<string, unknown>;
  tags?: { name: string; description?: string }[];
  components?: Record<string, unknown>;
}

export function mergeOpenApiDocuments(
  documents: OpenApiDocument[],
): OpenApiDocument {
  const merged: OpenApiDocument = {
    openapi: '3.0.0',
    info: {
      title: 'FEMS — Fire Extinguisher Management API',
      description:
        'Unified API via gateway (port 3000). Authenticate with POST /api/auth/login, then Authorize with your JWT.',
      version: '1.0',
      contact: { name: 'FEMS', email: 'support@fems.local' },
    },
    paths: {},
    tags: [],
    components: {
      securitySchemes: {
        JWT: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT from POST /api/auth/login',
        },
      },
      schemas: {},
    },
  };

  const tagNames = new Set<string>();

  for (const doc of documents) {
    if (doc.paths) {
      Object.assign(merged.paths!, doc.paths);
    }
    if (doc.tags) {
      for (const tag of doc.tags) {
        if (!tagNames.has(tag.name)) {
          tagNames.add(tag.name);
          merged.tags!.push(tag);
        }
      }
    }
    const schemas = (doc.components as { schemas?: Record<string, unknown> })
      ?.schemas;
    if (schemas) {
      Object.assign(
        (merged.components as { schemas: Record<string, unknown> }).schemas,
        schemas,
      );
    }
  }

  return merged;
}

export async function fetchOpenApiSpec(url: string): Promise<OpenApiDocument> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json() as Promise<OpenApiDocument>;
}

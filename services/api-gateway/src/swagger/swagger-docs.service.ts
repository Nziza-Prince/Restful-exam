import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenApiDocument } from './aggregate-openapi';
import { loadMergedOpenApi } from './swagger-loader';

@Injectable()
export class SwaggerDocsService implements OnModuleInit {
  private readonly logger = new Logger(SwaggerDocsService.name);
  private spec: OpenApiDocument = { paths: {} };

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.spec = await loadMergedOpenApi(this.config, this.logger);
  }

  getSpec(): OpenApiDocument {
    return this.spec;
  }

  async refresh(): Promise<OpenApiDocument> {
    this.spec = await loadMergedOpenApi(this.config, this.logger);
    return this.spec;
  }
}

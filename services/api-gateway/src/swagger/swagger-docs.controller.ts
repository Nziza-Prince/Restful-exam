import { Controller, Get } from '@nestjs/common';
import { SwaggerDocsService } from './swagger-docs.service';

@Controller()
export class SwaggerDocsController {
  constructor(private readonly swaggerDocs: SwaggerDocsService) {}

  @Get('api/docs-json')
  getOpenApiJson() {
    return this.swaggerDocs.getSpec();
  }
}

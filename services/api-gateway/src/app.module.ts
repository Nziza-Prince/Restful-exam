import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayController } from './gateway.controller';
import { SwaggerDocsController } from './swagger/swagger-docs.controller';
import { SwaggerDocsService } from './swagger/swagger-docs.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [GatewayController, SwaggerDocsController],
  providers: [SwaggerDocsService],
  exports: [SwaggerDocsService],
})
export class AppModule {}

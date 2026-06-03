import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig, JwtPayloadStrategy } from '@fems/shared';
import { RenewalRequest } from './renewals/entities/renewal-request.entity';
import { RenewalsModule } from './renewals/renewals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmConfig(config, [RenewalRequest]),
    }),
    RenewalsModule,
  ],
  providers: [JwtPayloadStrategy],
})
export class AppModule {}

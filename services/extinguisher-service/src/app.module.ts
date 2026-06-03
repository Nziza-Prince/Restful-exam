import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig, JwtPayloadStrategy } from '@fems/shared';
import { ExtinguishersModule } from './extinguishers/extinguishers.module';
import { FireExtinguisher } from './extinguishers/entities/fire-extinguisher.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmConfig(config, [FireExtinguisher]),
    }),
    ExtinguishersModule,
  ],
  providers: [JwtPayloadStrategy],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig, JwtPayloadStrategy } from '@fems/shared';
import { Customer } from './customers/entities/customer.entity';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTypeOrmConfig(config, [Customer]),
    }),
    CustomersModule,
  ],
  providers: [JwtPayloadStrategy],
})
export class AppModule {}

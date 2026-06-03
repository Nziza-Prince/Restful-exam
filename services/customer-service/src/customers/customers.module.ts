import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './controllers/customers.controller';
import { CustomersInternalController } from './controllers/customers-internal.controller';
import { Customer } from './entities/customer.entity';
import { CustomersRepository } from './repositories/customers.repository';
import { CustomersService } from './services/customers.service';
import { AuthClient } from './clients/auth.client';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController, CustomersInternalController],
  providers: [CustomersService, CustomersRepository, AuthClient],
  exports: [CustomersService],
})
export class CustomersModule {}

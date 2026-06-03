import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CustomerClient,
  ExtinguisherClient,
} from '../clients/service.clients';
import { RenewalsController } from './controllers/renewals.controller';
import { RenewalsInternalController } from './controllers/renewals-internal.controller';
import { RenewalRequest } from './entities/renewal-request.entity';
import { RenewalsRepository } from './repositories/renewals.repository';
import { RenewalsService } from './services/renewals.service';

@Module({
  imports: [TypeOrmModule.forFeature([RenewalRequest]), HttpModule],
  controllers: [RenewalsController, RenewalsInternalController],
  providers: [
    RenewalsService,
    RenewalsRepository,
    CustomerClient,
    ExtinguisherClient,
  ],
  exports: [RenewalsService],
})
export class RenewalsModule {}

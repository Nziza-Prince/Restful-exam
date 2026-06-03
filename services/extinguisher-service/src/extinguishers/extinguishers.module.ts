import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerClient, NotificationClient } from '../clients/service.clients';
import { ExtinguishersController } from './controllers/extinguishers.controller';
import { ExtinguishersInternalController } from './controllers/extinguishers-internal.controller';
import { ExtinguisherInspection } from './entities/extinguisher-inspection.entity';
import { FireExtinguisher } from './entities/fire-extinguisher.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { ExtinguishersRepository } from './repositories/extinguishers.repository';
import { ExtinguisherCronService } from './services/extinguisher-cron.service';
import { ExtinguishersService } from './services/extinguishers.service';

@Module({
  imports: [TypeOrmModule.forFeature([FireExtinguisher, ExtinguisherInspection, MaintenanceLog]), HttpModule],
  controllers: [ExtinguishersController, ExtinguishersInternalController],
  providers: [
    ExtinguishersService,
    ExtinguisherCronService,
    ExtinguishersRepository,
    CustomerClient,
    NotificationClient,
  ],
  exports: [ExtinguishersService],
})
export class ExtinguishersModule {}

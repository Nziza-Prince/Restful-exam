import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dtos/create-customer.dto';

@ApiTags('internal')
@Controller('internal/customers')
@UseGuards(ServiceAuthGuard)
export class CustomersInternalController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('by-email/:email')
  findByEmail(@Param('email') email: string) {
    return this.customersService.findByEmail(email);
  }

  @Get('by-invitation-token/:token')
  findByInvitationToken(@Param('token') token: string) {
    return this.customersService.findByInvitationToken(token);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id/mark-invitation-used')
  markInvitationUsed(@Param('id') id: string) {
    return this.customersService.markInvitationUsed(id);
  }
}

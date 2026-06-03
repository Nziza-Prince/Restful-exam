import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
  UserRole,
} from '@fems/shared';
import { CreateCustomerDto } from '../dtos/create-customer.dto';
import { ListCustomersQueryDto } from '../dtos/list-customers-query.dto';
import { UpdateCustomerDto } from '../dtos/update-customer.dto';
import { CustomersService } from '../services/customers.service';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get current customer profile (customer role)' })
  findMe(@CurrentUser() user: JwtPayload) {
    return this.customersService.findMe(user.email);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a customer (admin)' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto, user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List customers with pagination and search (admin)' })
  findAll(@CurrentUser() _user: JwtPayload, @Query() query: ListCustomersQueryDto) {
    // No createdBy filter — admins see ALL customers regardless of origin
    return this.customersService.findAll(
      query.page ?? 1,
      query.limit ?? 10,
      query.search,
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get customer by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update customer (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete customer (admin)' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}

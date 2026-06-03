import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
  UserRole,
} from '@fems/shared';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: ListNotificationsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.findAll(query, user);
  }

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  findMine(@Query() query: ListNotificationsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.findForCustomer(query, user);
  }

  @Patch(':id/read')
  @Roles(UserRole.CUSTOMER)
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notificationsService.markRead(id, user);
  }

  @Patch('admin/:id/read')
  @Roles(UserRole.ADMIN)
  markReadAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markReadAdmin(id);
  }
}

import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard, UserRole } from '@fems/shared';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('notification-schedule')
  getNotificationSchedule() {
    return this.settingsService.getNotificationSchedule();
  }

  @Put('notification-schedule')
  updateNotificationSchedule(@Body() dto: UpdateSettingDto) {
    return this.settingsService.updateNotificationSchedule(dto);
  }

  @Get('escalation-rules')
  getEscalationRules() {
    return this.settingsService.getEscalationRules();
  }

  @Put('escalation-rules')
  updateEscalationRules(@Body() dto: UpdateSettingDto) {
    return this.settingsService.updateEscalationRules(dto);
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';
import {
  DEFAULT_ESCALATION_RULES,
  DEFAULT_NOTIFICATION_SCHEDULE,
  SETTING_KEYS,
} from './settings.constants';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingsRepo: Repository<SystemSetting>,
  ) {}

  async onModuleInit() {
    await this.ensureDefault(SETTING_KEYS.NOTIFICATION_SCHEDULE, DEFAULT_NOTIFICATION_SCHEDULE);
    await this.ensureDefault(SETTING_KEYS.ESCALATION_RULES, DEFAULT_ESCALATION_RULES);
  }

  private async ensureDefault(key: string, value: Record<string, unknown>) {
    const existing = await this.settingsRepo.findOne({ where: { key } });
    if (!existing) {
      await this.settingsRepo.save(this.settingsRepo.create({ key, value }));
    }
  }

  async getNotificationSchedule() {
    return this.getSetting(SETTING_KEYS.NOTIFICATION_SCHEDULE);
  }

  async getEscalationRules() {
    return this.getSetting(SETTING_KEYS.ESCALATION_RULES);
  }

  async updateNotificationSchedule(dto: UpdateSettingDto) {
    return this.upsert(SETTING_KEYS.NOTIFICATION_SCHEDULE, dto.value);
  }

  async updateEscalationRules(dto: UpdateSettingDto) {
    return this.upsert(SETTING_KEYS.ESCALATION_RULES, dto.value);
  }

  private async getSetting(key: string) {
    const setting = await this.settingsRepo.findOne({ where: { key } });
    return setting?.value ?? {};
  }

  private async upsert(key: string, value: Record<string, unknown>) {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
    } else {
      setting = this.settingsRepo.create({ key, value });
    }
    return this.settingsRepo.save(setting);
  }
}

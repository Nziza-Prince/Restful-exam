import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@fems/shared';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const existing = await this.usersRepo.findOne({
      where: { email: 'admin@fems.local' },
    });
    if (existing) return;

    const password = await bcrypt.hash('Admin@123', 12);
    await this.usersRepo.save(
      this.usersRepo.create({
        fullName: 'System Administrator',
        email: 'admin@fems.local',
        password,
        role: UserRole.ADMIN,
      }),
    );
    this.logger.log('Default admin created: admin@fems.local / Admin@123');
  }
}

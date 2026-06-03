import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UsersController } from './users.controller';
import { UsersInternalController } from './users-internal.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController, UsersInternalController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

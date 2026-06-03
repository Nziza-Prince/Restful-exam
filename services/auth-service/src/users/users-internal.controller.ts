import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { UsersService } from './users.service';

class CreatePendingUserDto {
  email: string;
  fullName: string;
}

@ApiTags('internal')
@Controller('internal/users')
@UseGuards(ServiceAuthGuard)
export class UsersInternalController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  createPending(@Body() dto: CreatePendingUserDto): Promise<void> {
    return this.usersService.createPending(dto.email, dto.fullName);
  }

  @Delete('by-email/:email')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteByEmail(@Param('email') email: string): Promise<void> {
    return this.usersService.deleteByEmail(email);
  }
}

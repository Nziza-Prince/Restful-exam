import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-service-key'];
    const expected = this.config.get<string>('SERVICE_INTERNAL_KEY');
    if (!expected || key !== expected) {
      throw new UnauthorizedException('Invalid service key');
    }
    return true;
  }
}

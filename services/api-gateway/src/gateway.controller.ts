import { Controller, Get } from '@nestjs/common';

@Controller()
export class GatewayController {
  @Get('api')
  root() {
    return {
      name: 'FEMS — Fire Extinguisher Management System',
      version: '1.0',
      gateway: true,
      health: '/api/health',
      docs: '/api/docs',
      services: {
        auth: 'http://localhost:3001/api/docs',
        customer: 'http://localhost:3002/api/docs',
        extinguisher: 'http://localhost:3003/api/docs',
        notification: 'http://localhost:3004/api/docs',
        renewal: 'http://localhost:3005/api/docs',
        compliance: 'http://localhost:3006/api/docs',
        report: 'http://localhost:3007/api/docs',
      },
      routes: [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/refresh',
        'POST /api/auth/logout',
        'GET  /api/users/me',
        'GET  /api/customers',
        'GET  /api/extinguishers',
        'GET  /api/notifications',
        'GET  /api/renewals',
        'GET  /api/compliance',
        'GET  /api/reports',
      ],
    };
  }

  @Get('api/health')
  health() {
    return {
      status: 'ok',
      gateway: true,
      services: [
        'auth',
        'customer',
        'extinguisher',
        'notification',
        'renewal',
        'compliance',
        'report',
      ],
    };
  }
}

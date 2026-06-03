import { bootstrapService } from '@fems/shared';
import { AppModule } from './app.module';

bootstrapService({
  appModule: AppModule,
  serviceName: 'Customer Service',
  defaultPort: 3002,
});

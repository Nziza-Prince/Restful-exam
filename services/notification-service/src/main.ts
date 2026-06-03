import { bootstrapService } from '@fems/shared';
import { AppModule } from './app.module';

bootstrapService({
  appModule: AppModule,
  serviceName: 'Notification Service',
  defaultPort: 3004,
});

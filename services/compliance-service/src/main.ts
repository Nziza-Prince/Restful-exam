import { bootstrapService } from '@fems/shared';
import { AppModule } from './app.module';

bootstrapService({
  appModule: AppModule,
  serviceName: 'Compliance Service',
  defaultPort: 3006,
});

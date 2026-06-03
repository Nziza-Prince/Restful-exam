import { bootstrapService } from '@fems/shared';
import { AppModule } from './app.module';

bootstrapService({
  appModule: AppModule,
  serviceName: 'Extinguisher Service',
  defaultPort: 3003,
});

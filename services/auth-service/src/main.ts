import { bootstrapService } from '@fems/shared';
import { AppModule } from './app.module';

bootstrapService({
  appModule: AppModule,
  serviceName: 'FEMS Auth Service',
  defaultPort: 3001,
});

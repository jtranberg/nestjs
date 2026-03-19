import {
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { SensorsModule } from './sensors/sensor.module';
import { HealthController } from './health.controller';
import { ObservabilityModule } from './obseravability/observability.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { RequestTimerMiddleware } from './common/middleware/request-timer.middleware';

@Module({
  imports: [SensorsModule, ObservabilityModule],
  controllers: [HealthController],
  providers: [MetricsInterceptor],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTimerMiddleware).forRoutes('*');
  }
}
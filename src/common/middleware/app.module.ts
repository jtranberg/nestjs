// app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestTimerMiddleware } from './request-timer.middleware';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestTimerMiddleware).forRoutes('*');
  }
}
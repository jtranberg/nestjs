import { Module } from '@nestjs/common';
import { SensorsModule } from './sensors/sensor.module';
import { HealthController } from './health.controller';

@Module({
  imports: [SensorsModule],
  controllers: [HealthController],
})
export class AppModule {}
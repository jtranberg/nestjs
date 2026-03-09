import { Module } from '@nestjs/common';
import { SensorsModule } from './sensors/sensor.module';

@Module({
  imports: [SensorsModule],
})
export class AppModule {}
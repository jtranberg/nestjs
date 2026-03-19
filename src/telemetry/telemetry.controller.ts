// src/telemetry/telemetry.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('reading')
  ingestReading(@Body() body: any) {
    return this.telemetryService.ingestReading(body);
  }
}
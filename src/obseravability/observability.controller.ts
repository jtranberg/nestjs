// src/observability/observability.controller.ts
import { Controller, Delete, Get } from '@nestjs/common';
import { ObservabilityService } from './observability.service';

@Controller('observability')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get()
  getAll() {
    return {
      summary: this.observabilityService.getSummary(),
      events: this.observabilityService.getObservations(),
    };
  }

  @Delete()
  clear() {
    this.observabilityService.clear();
    return { ok: true };
  }
}
// src/observability/observability.service.ts
import { Injectable } from '@nestjs/common';

export type ApiObservation = {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

@Injectable()
export class ObservabilityService {
  private readonly observations: ApiObservation[] = [];

  addObservation(observation: ApiObservation) {
    this.observations.unshift(observation);

    if (this.observations.length > 200) {
      this.observations.pop();
    }
  }

  getObservations() {
    return this.observations;
  }

  getSummary() {
    const total = this.observations.length;
    const failed = this.observations.filter(
      (o) => o.statusCode === 0 || o.statusCode >= 400,
    ).length;
    const succeeded = this.observations.filter(
      (o) => o.statusCode > 0 && o.statusCode < 400,
    ).length;

    const avgLatency =
      total > 0
        ? Math.round(
            this.observations.reduce((sum, o) => sum + o.durationMs, 0) / total,
          )
        : 0;

    return {
      total,
      failed,
      succeeded,
      successRate: total > 0 ? Math.round((succeeded / total) * 100) : 0,
      avgLatency,
    };
  }

  clear() {
    this.observations.length = 0;
  }
}
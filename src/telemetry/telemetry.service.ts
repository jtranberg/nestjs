// src/telemetry/telemetry.service.ts
import { Injectable, Logger } from '@nestjs/common';

type ReadingPayload = {
  deviceId: string;
  voltage: number;
  current: number;
  temperature: number;
  connected: boolean;
  timestamp: string;
};

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  ingestReading(payload: ReadingPayload) {
    this.logger.log({
      event: 'sensor_reading_received',
      ...payload,
    });

    if (!payload.connected) {
      this.logger.warn({
        event: 'device_disconnected',
        deviceId: payload.deviceId,
        reason: 'reported_offline',
        timestamp: payload.timestamp,
      });
    }

    if (payload.voltage < 0 || payload.voltage > 1000) {
      this.logger.warn({
        event: 'sensor_anomaly_detected',
        deviceId: payload.deviceId,
        type: 'voltage_out_of_range',
        value: payload.voltage,
      });
    }

    return { ok: true };
  }
}
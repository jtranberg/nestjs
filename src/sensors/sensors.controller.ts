import { Controller, Get } from '@nestjs/common';

type SensorStatus = 'healthy' | 'warning' | 'critical';
type LinkStatus = 'online' | 'offline' | 'degraded';
type BleStatus = 'ready' | 'pairing' | 'offline';

interface SensorReading {
  id: string;
  name: string;
  temperature: number;
  voltage: number;
  soc: number;
  status: SensorStatus;
  location: string;
  updatedAt: string;
}

@Controller('api/sensors')
export class SensorsController {
  @Get()
  getSensors() {
    const sensors: SensorReading[] = [
      {
        id: 'bat-101',
        name: 'Battery Rack A1',
        temperature: 26,
        voltage: 48.7,
        soc: 91,
        status: 'healthy',
        location: 'Bay 1',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bat-102',
        name: 'Battery Rack A2',
        temperature: 31,
        voltage: 47.9,
        soc: 78,
        status: 'warning',
        location: 'Bay 1',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bat-103',
        name: 'Battery Rack B1',
        temperature: 24,
        voltage: 49.1,
        soc: 96,
        status: 'healthy',
        location: 'Bay 2',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'bat-104',
        name: 'Battery Rack C1',
        temperature: 39,
        voltage: 45.8,
        soc: 42,
        status: 'critical',
        location: 'Bay 3',
        updatedAt: new Date().toISOString(),
      },
    ];

    const alerts = sensors.filter((s) => s.status !== 'healthy').length;
    const score = Math.max(0, 100 - alerts * 18);

    const bleStatus: BleStatus = 'ready';
    const internetStatus: LinkStatus = 'online';

    return {
      score,
      alerts,
      bleStatus,
      internetStatus,
      sensors,
    };
  }
}
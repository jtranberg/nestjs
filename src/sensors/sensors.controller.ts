import { Controller, Get } from '@nestjs/common';

type ModuleStatus = 'healthy' | 'warning' | 'critical';
type LinkStatus = 'online' | 'offline' | 'degraded';
type BleStatus = 'ready' | 'pairing' | 'offline';

interface BatteryModule {
  id: string;
  name: string;
  location: string;
  status: ModuleStatus;
  bleStatus: BleStatus;
  internetStatus: LinkStatus;
  temperatures: number[];
  voltages: number[];
  gasPpm: number;
  co2Ppm: number;
  laserMm: number;
  vibrationG: number;
  updatedAt: string;
}

function jitter(base: number, range: number, decimals = 1): number {
  const value = base + (Math.random() * range - range / 2);
  return Number(value.toFixed(decimals));
}

@Controller('api/sensors')
export class SensorsController {
  @Get()
  getSensors() {
    const temperatures = [
      jitter(26.4, 3),
      jitter(27.1, 3),
      jitter(28.3, 3),
      jitter(25.7, 3),
      jitter(24.9, 3),
    ];

    const voltages = [
      jitter(3.71, 0.08, 2),
      jitter(3.69, 0.08, 2),
      jitter(3.72, 0.08, 2),
      jitter(3.70, 0.08, 2),
      jitter(3.68, 0.08, 2),
      jitter(3.71, 0.08, 2),
      jitter(3.73, 0.08, 2),
      jitter(3.69, 0.08, 2),
      jitter(3.70, 0.08, 2),
      jitter(3.72, 0.08, 2),
    ];

    const maxTemp = Math.max(...temperatures);
    const minVoltage = Math.min(...voltages);

    let moduleStatus: ModuleStatus = 'healthy';
    if (maxTemp >= 38 || minVoltage < 3.45) {
      moduleStatus = 'critical';
    } else if (maxTemp >= 32 || minVoltage < 3.58) {
      moduleStatus = 'warning';
    }

    const module: BatteryModule = {
      id: 'mod-a1',
      name: 'Battery Module A1',
      location: 'Rack 1',
      status: moduleStatus,
      bleStatus: 'ready',
      internetStatus: 'online',
      temperatures,
      voltages,
      gasPpm: jitter(42, 12, 0),
      co2Ppm: jitter(615, 40, 0),
      laserMm: jitter(41, 4, 0),
      vibrationG: jitter(0.08, 0.04, 2),
      updatedAt: new Date().toISOString(),
    };

    const alerts = module.status === 'healthy' ? 0 : module.status === 'warning' ? 1 : 2;
    const score = Math.max(0, 100 - alerts * 18);

    return {
      score,
      alerts,
      bleStatus: module.bleStatus,
      internetStatus: module.internetStatus,
      modules: [module],
    };
  }
}
import { Controller, Get} from '@nestjs/common';

@Controller('api')
export class HealthController {

  @Get('health')
  health() {
    return {
      service: "moment-energy-demo",
      status: "ok",
      timestamp: new Date()
    };
  }

}
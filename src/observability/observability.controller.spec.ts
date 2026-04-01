import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityController } from './observability.controller';
import { ObservabilityService } from './observability.service';

describe('ObservabilityController', () => {
  let controller: ObservabilityController;
  let service: ObservabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservabilityController],
      providers: [ObservabilityService],
    }).compile();

    controller = module.get<ObservabilityController>(ObservabilityController);
    service = module.get<ObservabilityService>(ObservabilityService);

    service.clear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return summary and events', () => {
    service.addObservation({
      timestamp: new Date().toISOString(),
      method: 'GET',
      path: '/test',
      statusCode: 200,
      durationMs: 10,
    });

    const result = controller.getAll();

    expect(result.events).toHaveLength(1);
    expect(result.summary.total).toBe(1);
    expect(result.summary.succeeded).toBe(1);
    expect(result.summary.failed).toBe(0);
  });

  it('should clear observations', () => {
    service.addObservation({
      timestamp: new Date().toISOString(),
      method: 'GET',
      path: '/test',
      statusCode: 200,
      durationMs: 10,
    });

    const cleared = controller.clear();
    const result = controller.getAll();

    expect(cleared).toEqual({ ok: true });
    expect(result.events).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });
});
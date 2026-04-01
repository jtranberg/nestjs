import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityService } from './observability.service';

describe('ObservabilityService', () => {
  let service: ObservabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObservabilityService],
    }).compile();

    service = module.get<ObservabilityService>(ObservabilityService);
    service.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty observations initially', () => {
    expect(service.getObservations()).toEqual([]);
  });

  it('should add an observation', () => {
    service.addObservation({
      timestamp: new Date().toISOString(),
      method: 'GET',
      path: '/api/health',
      statusCode: 200,
      durationMs: 25,
    });

    const observations = service.getObservations();

    expect(observations).toHaveLength(1);
    expect(observations[0].path).toBe('/api/health');
    expect(observations[0].statusCode).toBe(200);
  });

  it('should calculate summary correctly', () => {
    service.addObservation({
      timestamp: new Date().toISOString(),
      method: 'GET',
      path: '/ok',
      statusCode: 200,
      durationMs: 20,
    });

    service.addObservation({
      timestamp: new Date().toISOString(),
      method: 'POST',
      path: '/fail',
      statusCode: 500,
      durationMs: 40,
    });

    const summary = service.getSummary();

    expect(summary.total).toBe(2);
    expect(summary.succeeded).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.successRate).toBe(50);
    expect(summary.avgLatency).toBe(30);
  });

  it('should clear observations', () => {
    service.addObservation({
      timestamp: new Date().toISOString(),
      method: 'GET',
      path: '/test',
      statusCode: 200,
      durationMs: 10,
    });

    service.clear();

    expect(service.getObservations()).toEqual([]);
  });
});
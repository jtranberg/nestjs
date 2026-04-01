import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';
import { ObservabilityService } from '../../observability/observability.service';

describe('MetricsInterceptor', () => {
  let service: ObservabilityService;
  let interceptor: MetricsInterceptor;

  beforeEach(() => {
    service = new ObservabilityService();
    service.clear();
    interceptor = new MetricsInterceptor(service);
  });

  function createMockExecutionContext(req: any, res: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as ExecutionContext;
  }

  it('should record a successful request', (done) => {
    const req = {
      method: 'GET',
      url: '/api/health',
      originalUrl: '/api/health',
      __startTime: Date.now() - 25,
    };

    const res = {
      statusCode: 200,
    };

    const context = createMockExecutionContext(req, res);

    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        const observations = service.getObservations();

        expect(observations).toHaveLength(1);
        expect(observations[0].method).toBe('GET');
        expect(observations[0].path).toBe('/api/health');
        expect(observations[0].statusCode).toBe(200);
        expect(observations[0].durationMs).toBeGreaterThanOrEqual(0);
        done();
      },
      error: done,
    });
  });

  it('should record a failed request', (done) => {
    const req = {
      method: 'POST',
      url: '/tasks',
      originalUrl: '/tasks',
      __startTime: Date.now() - 40,
    };

    const res = {
      statusCode: 500,
    };

    const context = createMockExecutionContext(req, res);

    const next: CallHandler = {
      handle: () =>
        throwError(() => ({
          status: 500,
          message: 'Something went wrong',
        })),
    };

    interceptor.intercept(context, next).subscribe({
      next: () => done(new Error('Expected interceptor to throw')),
      error: () => {
        const observations = service.getObservations();

        expect(observations).toHaveLength(1);
        expect(observations[0].method).toBe('POST');
        expect(observations[0].path).toBe('/tasks');
        expect(observations[0].statusCode).toBe(500);
        expect(observations[0].durationMs).toBeGreaterThanOrEqual(0);
        done();
      },
    });
  });
});
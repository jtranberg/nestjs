// src/common/interceptors/metrics.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ObservabilityService } from '../../obseravability/observability.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    private readonly observabilityService: ObservabilityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const start = req.__startTime ?? Date.now();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;

        const observation = {
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs,
        };

        this.observabilityService.addObservation(observation);

        console.log({
          event: 'api_request',
          ...observation,
        });
      }),
      catchError((err) => {
        const durationMs = Date.now() - start;

        const observation = {
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: err?.status || 500,
          durationMs,
        };

        this.observabilityService.addObservation(observation);

        console.error({
          event: 'api_request_failed',
          ...observation,
          message: err?.message,
        });

        return throwError(() => err);
      }),
    );
  }
}
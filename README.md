# Telemetry Dashboard

![Tests](https://img.shields.io/badge/tests-13%20passing-brightgreen)
![NestJS](https://img.shields.io/badge/NestJS-backend-e0234e)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Status](https://img.shields.io/badge/status-active-success)

## Preview

![Telemetry Dashboard Screenshot](./screenshot.png)
Backend observability and telemetry system built with NestJS to capture, summarize, and expose API request metrics for operational visibility.

## Features

- Request telemetry capture through interceptor-based instrumentation
- In-memory observability event store
- Summary metrics for success rate, failures, and average latency
- Controller endpoints to inspect and clear telemetry data
- Unit-tested services, controllers, and interceptor behavior

## Tech Stack

- NestJS
- TypeScript
- Jest
- RxJS

## Tested Areas

- App controller
- Tasks controller
- Tasks service
- Observability controller
- Observability service
- Metrics interceptor

## Run Locally

```bash
npm install
npm run start:dev
import { performanceMonitor } from '../lib/performance-monitor';

describe('performanceMonitor', () => {
  it('should add and retrieve metrics', () => {
    performanceMonitor.clearMetrics();
    performanceMonitor.addMetric('Test Metric', 123, 'ms', { foo: 'bar' });
    const metrics = performanceMonitor.getMetricsByName('Test Metric');
    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0].name).toBe('Test Metric');
    expect(metrics[0].value).toBe(123);
    expect(metrics[0].unit).toBe('ms');
    expect(metrics[0].metadata).toEqual({ foo: 'bar' });
  });
});
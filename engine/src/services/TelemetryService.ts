import * as appInsights from 'applicationinsights';

export class TelemetryService {
  private client: appInsights.TelemetryClient | null = null;
  private isInitialized = false;

  constructor() {
    const connectionString = process.env.APPINSIGHTS_CONNECTION_STRING;
    
    if (connectionString) {
      try {
        appInsights.setup(connectionString)
          .setAutoDependencyCorrelation(true)
          .setAutoCollectRequests(true)
          .setAutoCollectPerformance(true, true)
          .setAutoCollectExceptions(true)
          .setAutoCollectDependencies(true)
          .setAutoCollectConsole(true)
          .setUseDiskRetryCaching(true)
          .setSendLiveMetrics(true)
          .start();

        this.client = appInsights.defaultClient;
        this.isInitialized = true;
        console.log('📊 Application Insights initialized');
      } catch (error) {
        console.warn('⚠️  Failed to initialize Application Insights:', error);
      }
    } else {
      console.warn('⚠️  APPINSIGHTS_CONNECTION_STRING not set, telemetry disabled');
    }
  }

  trackEvent(name: string, properties?: { [key: string]: string }): void {
    if (this.client && this.isInitialized) {
      this.client.trackEvent({
        name,
        properties,
      });
    } else {
      console.log(`📊 [MOCK] Event: ${name}`, properties);
    }
  }

  trackMetric(name: string, value: number, properties?: { [key: string]: string }): void {
    if (this.client && this.isInitialized) {
      this.client.trackMetric({
        name,
        value,
        properties,
      });
    } else {
      console.log(`📊 [MOCK] Metric: ${name} = ${value}`, properties);
    }
  }

  trackException(exception: Error, properties?: { [key: string]: string }): void {
    if (this.client && this.isInitialized) {
      this.client.trackException({
        exception,
        properties,
      });
    } else {
      console.error(`📊 [MOCK] Exception: ${exception.message}`, properties);
    }
  }

  trackDependency(name: string, commandName: string, duration: number, success: boolean): void {
    if (this.client && this.isInitialized) {
      this.client.trackDependency({
        target: name,
        name: commandName,
        data: commandName,
        duration,
        resultCode: success ? 200 : 500,
        success,
        dependencyTypeName: 'HTTP',
      });
    } else {
      console.log(`📊 [MOCK] Dependency: ${name} - ${commandName} (${duration}ms, success: ${success})`);
    }
  }

  trackGameMetrics(playerCount: number, tickRate: number, averageLatency: number): void {
    this.trackMetric('Game.PlayerCount', playerCount);
    this.trackMetric('Game.TickRate', tickRate);
    this.trackMetric('Game.AverageLatency', averageLatency);
  }

  flush(): void {
    if (this.client && this.isInitialized) {
      this.client.flush();
    }
  }
}

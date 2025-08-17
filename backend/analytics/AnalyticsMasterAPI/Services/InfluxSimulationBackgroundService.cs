using AnalyticsPSQL_MasterApi.Infrastructure;

namespace AnalyticsPSQL_MasterApi.Services
{
    public class InfluxSimulationBackgroundService : BackgroundService
    {
        private readonly ILogger<InfluxSimulationBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly int _intervalMinutes;

        public InfluxSimulationBackgroundService(
            ILogger<InfluxSimulationBackgroundService> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
            _intervalMinutes = configuration.GetValue<int>("InfluxDb:SimulationIntervalMinutes", 10);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("InfluxDB Simulation service initialized \n");

            // Wait start
            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var simulationService = scope.ServiceProvider.GetRequiredService<IInfluxSimulationService>();

                    // Simulate metrics of the last hour
                    var to = DateTime.UtcNow;
                    var from = to.AddHours(-1);

                    await simulationService.SimulateMetricsForDevicesAsync(from, to);

                    _logger.LogInformation($"Simulation completed next execution {_intervalMinutes} minutes");

                    await Task.Delay(TimeSpan.FromMinutes(_intervalMinutes), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Simulation cancelled");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "\nError in simulated data [CRITICAL]");
                    await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
                }
            }
        }
    }
}

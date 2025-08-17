using AnalyticsPSQL_MasterApi.Data;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsPSQL_MasterApi.Services
{
    public class DataCleanupService: BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DataCleanupService> _logger;
        private readonly int _daysToKeep;

        public DataCleanupService(
            IServiceProvider serviceProvider,
            ILogger<DataCleanupService> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _daysToKeep = configuration.GetValue<int>("DataRetention:DaysToKeep", 90);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Cleanup everyday at 2 AM
                    var now = DateTime.Now;
                    var nextRun = now.Date.AddDays(1).AddHours(2);
                    var delay = nextRun - now;

                    if (delay.TotalMilliseconds > 0)
                    {
                        await Task.Delay(delay, stoppingToken);
                    }

                    await PerformCleanupAsync();

                    _logger.LogInformation("Automatic cleanup completed!");
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "ERROR during automatic cleanup");
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task PerformCleanupAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var cutoffDate = DateTime.UtcNow.AddDays(-_daysToKeep);

            try
            {
                // Clean old readings
                var deletedReadings = await context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM sensor_readings WHERE timestamp < {0}", cutoffDate);

                // Clean old metrics
                var deletedDeviceMetrics = await context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM device_metrics_hourly WHERE hour_timestamp < {0}", cutoffDate);

                var deletedSensorMetrics = await context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM sensor_metrics_hourly WHERE hour_timestamp < {0}", cutoffDate);

                // Clean network logs
                var deletedNetworkLogs = await context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM network_logs WHERE connected_at < {0}", cutoffDate);

                // Clean old status
                var deletedDeviceStatus = await context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM device_status WHERE timestamp < {0}", cutoffDate);

                // Clean old alerts
                var deletedAlerts = await context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM device_alerts WHERE resolved_at < {0} AND is_resolved = true", cutoffDate);

                _logger.LogInformation($"Limpieza completada - Eliminados: {deletedReadings} lecturas, " +
                                     $"{deletedDeviceMetrics} métricas de dispositivo, " +
                                     $"{deletedSensorMetrics} métricas de sensor, " +
                                     $"{deletedNetworkLogs} logs de red, " +
                                     $"{deletedDeviceStatus} estados, " +
                                     $"{deletedAlerts} alertas");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ERROR cleaning task");
                throw;
            }
        }
    }
}

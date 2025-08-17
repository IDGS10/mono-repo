using AnalyticsPSQL_MasterApi.Data;
using AnalyticsPSQL_MasterApi.DTOs;
using AnalyticsPSQL_MasterApi.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsPSQL_MasterApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SimulationController : ControllerBase
    {
        private readonly IInfluxSimulationService _simulationService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SimulationController> _logger;

        public SimulationController(
            IInfluxSimulationService simulationService,
            ApplicationDbContext context,
            ILogger<SimulationController> logger)
        {
            _simulationService = simulationService;
            _context = context;
            _logger = logger;
        }

        [HttpPost("run-simulation")]
        public async Task<IActionResult> RunSimulation([FromBody] SimulationRequest request)
        {
            try
            {
                var from = request.From ?? DateTime.UtcNow.AddHours(-24);
                var to = request.To ?? DateTime.UtcNow;

                _logger.LogInformation($"Iniciando simulación manual desde {from} hasta {to}");

                await _simulationService.SimulateMetricsForDevicesAsync(from, to);

                var result = new
                {
                    Success = true,
                    Message = "Simulación completada exitosamente",
                    TimeRange = new { From = from, To = to },
                    Timestamp = DateTime.UtcNow
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante simulación manual");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpPost("simulate-historical")]
        public async Task<IActionResult> SimulateHistoricalData([FromBody] HistoricalSimulationRequest request)
        {
            try
            {
                var startDate = request.StartDate ?? DateTime.UtcNow.AddDays(-7);
                var endDate = request.EndDate ?? DateTime.UtcNow;
                var intervalHours = request.IntervalHours ?? 6;

                _logger.LogInformation($"Iniciando simulación histórica desde {startDate} hasta {endDate} con intervalos de {intervalHours} horas");

                var processedPeriods = 0;
                var currentDate = startDate;

                while (currentDate < endDate)
                {
                    var periodEnd = currentDate.AddHours(intervalHours);
                    if (periodEnd > endDate) periodEnd = endDate;

                    await _simulationService.SimulateMetricsForDevicesAsync(currentDate, periodEnd);

                    processedPeriods++;
                    currentDate = periodEnd;

                    // Pequeña pausa para no sobrecargar el sistema
                    await Task.Delay(1000);
                }

                var result = new
                {
                    Success = true,
                    Message = "Simulación histórica completada",
                    ProcessedPeriods = processedPeriods,
                    TimeRange = new { From = startDate, To = endDate },
                    IntervalHours = intervalHours
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante simulación histórica");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("device-metrics/{deviceId}")]
        public async Task<IActionResult> GetDeviceMetrics(Guid deviceId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            try
            {
                var fromDate = from ?? DateTime.UtcNow.AddDays(-1);
                var toDate = to ?? DateTime.UtcNow;

                var deviceMetrics = await _context.DeviceMetricsHourly
                    .Where(dm => dm.DeviceId == deviceId &&
                               dm.HourTimestamp >= fromDate &&
                               dm.HourTimestamp <= toDate)
                    .OrderBy(dm => dm.HourTimestamp)
                    .Select(dm => new
                    {
                        dm.HourTimestamp,
                        dm.UptimePercentage,
                        dm.AvgCpuUsage,
                        dm.AvgMemoryUsage,
                        dm.AvgBatteryLevel,
                        dm.ReadingCount,
                        dm.ErrorCount,
                        dm.WarningCount
                    })
                    .ToListAsync();

                var sensorMetrics = await _context.SensorMetricsHourly
                    .Where(sm => sm.DeviceId == deviceId &&
                               sm.HourTimestamp >= fromDate &&
                               sm.HourTimestamp <= toDate)
                    .Include(sm => sm.SensorType)
                    .OrderBy(sm => sm.HourTimestamp)
                    .Select(sm => new
                    {
                        sm.HourTimestamp,
                        SensorName = sm.SensorType.SensorName,
                        sm.AvgValue,
                        sm.MinValue,
                        sm.MaxValue,
                        sm.ReadingCount
                    })
                    .ToListAsync();

                return Ok(new
                {
                    DeviceId = deviceId,
                    TimeRange = new { From = fromDate, To = toDate },
                    DeviceMetrics = deviceMetrics,
                    SensorMetrics = sensorMetrics
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error obteniendo métricas del dispositivo");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpDelete("cleanup-old-data")]
        public async Task<IActionResult> CleanupOldData([FromQuery] int daysToKeep = 30)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);

                var deletedReadings = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM sensor_readings WHERE timestamp < {0}", cutoffDate);

                var deletedDeviceMetrics = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM device_metrics_hourly WHERE hour_timestamp < {0}", cutoffDate);

                var deletedSensorMetrics = await _context.Database.ExecuteSqlRawAsync(
                    "DELETE FROM sensor_metrics_hourly WHERE hour_timestamp < {0}", cutoffDate);

                var result = new
                {
                    Success = true,
                    Message = $"Datos anteriores a {cutoffDate:yyyy-MM-dd} eliminados",
                    DeletedSensorReadings = deletedReadings,
                    DeletedDeviceMetrics = deletedDeviceMetrics,
                    DeletedSensorMetrics = deletedSensorMetrics
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error limpiando datos antiguos");
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        [HttpGet("health-check")]
        public async Task<IActionResult> HealthCheck()
        {
            try
            {
                // Verificar conexión a PostgreSQL
                await _context.Database.CanConnectAsync();

                // Verificar datos recientes
                var recentReadings = await _context.SensorReadings
                    .Where(sr => sr.Timestamp >= DateTime.UtcNow.AddHours(-1))
                    .CountAsync();

                var status = new
                {
                    Status = "Healthy",
                    PostgreSQL = "Connected",
                    RecentReadings = recentReadings,
                    Timestamp = DateTime.UtcNow
                };

                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(500, new { Status = "Unhealthy", Error = ex.Message });
            }
        }
    }
}

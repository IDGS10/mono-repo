using AnalyticsPSQL_MasterApi.Data;
using AnalyticsPSQL_MasterApi.DTOs;
using AnalyticsPSQL_MasterApi.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsPSQL_MasterApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeviceMetricsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DeviceMetricsController> _logger;

        public DeviceMetricsController(ApplicationDbContext context, ILogger<DeviceMetricsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region Device Overview and Status

        /// <summary>
        /// Get overview of all devices with basic metrics
        /// </summary>
        [HttpGet("devices/overview")]
        public async Task<ActionResult<DevicesOverviewDto>> GetDevicesOverview()
        {
            try
            {
                var totalDevices = await _context.Esp32Devices.CountAsync();
                var onlineDevices = await _context.Esp32Devices.CountAsync(d => d.IsOnline);
                var activeSwarms = await _context.DeviceSwarms.CountAsync(s => s.IsActive);

                var devicesByStatus = await _context.Esp32Devices
                    .GroupBy(d => d.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() })
                    .ToListAsync();

                var overview = new DevicesOverviewDto
                {
                    TotalDevices = totalDevices,
                    OnlineDevices = onlineDevices,
                    OfflineDevices = totalDevices - onlineDevices,
                    ActiveSwarms = activeSwarms,
                    DevicesByStatus = devicesByStatus.ToDictionary(x => x.Status ?? "unknown", x => x.Count)
                };

                return Ok(overview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting devices overview");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get list of all devices with their current status
        /// </summary>
        [HttpGet("devices")]
        public async Task<ActionResult<List<DeviceStatusDto>>> GetAllDevices(
            [FromQuery] int page = 1, // Check on detail
            [FromQuery] int pageSize = 50,
            [FromQuery] string? status = "assigned",
            [FromQuery] bool? isOnline = true)
        {
            try
            {
                var query = _context.Esp32Devices.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(status))
                    query = query.Where(d => d.Status == status);

                if (isOnline.HasValue)
                    query = query.Where(d => d.IsOnline == isOnline.Value);

                var devices = await query
                    .Include(d => d.Swarm)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DeviceStatusDto
                    {
                        DeviceId = d.DeviceId,
                        DeviceName = d.DeviceName,
                        MacAddress = d.MacAddress,
                        DeviceType = d.DeviceType ?? "ESP32",
                        Location = d.Location,
                        IsOnline = d.IsOnline,
                        Status = d.Status ?? "unknown",
                        BatteryLevel = d.BatteryLevel,
                        LastSeen = d.LastSeen,
                        SwarmName = d.Swarm != null ? d.Swarm.SwarmName : null,
                        FirmwareVersion = d.FirmwareVersion,
                        LastIpAddress = d.LastIpAddress
                    })
                    .ToListAsync();

                return Ok(devices);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting devices list");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get detailed information for a specific device
        /// </summary>
        [HttpGet("devices/{deviceId}")]
        public async Task<ActionResult<DeviceDetailDto>> GetDeviceDetail([FromRoute] Guid deviceId)
        {
            try
            {
                var device = await _context.Esp32Devices
                    .Include(d => d.Swarm)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

                if (device == null)
                    return NotFound($"Device with ID {deviceId} not found");

                // Get latest status
                var latestStatus = await _context.DeviceStatus
                    .Where(ds => ds.DeviceId == deviceId)
                    .OrderByDescending(ds => ds.Timestamp)
                    .FirstOrDefaultAsync();

                // Get sensor count
                var sensorCount = await _context.DeviceSensors
                    .CountAsync(ds => ds.DeviceId == deviceId && ds.IsActive);

                // Get latest readings count (last 24 hours)
                var yesterday = DateTime.UtcNow.AddDays(-1);
                var recentReadingsCount = await _context.SensorReadings
                    .CountAsync(sr => sr.DeviceId == deviceId && sr.Timestamp >= yesterday);

                var deviceDetail = new DeviceDetailDto
                {
                    DeviceId = device.DeviceId,
                    DeviceName = device.DeviceName,
                    MacAddress = device.MacAddress,
                    DeviceType = device.DeviceType ?? "ESP32",
                    Location = device.Location,
                    IsOnline = device.IsOnline,
                    Status = device.Status ?? "unknown",
                    BatteryLevel = device.BatteryLevel,
                    LastSeen = device.LastSeen,
                    FirmwareVersion = device.FirmwareVersion,
                    LastIpAddress = device.LastIpAddress,
                    InstallationDate = device.InstallationDate,
                    SwarmName = device.Swarm.SwarmName,
                    SwarmId = device.SwarmId,
                    SensorCount = sensorCount,
                    RecentReadingsCount = recentReadingsCount,
                    LatestStatus = latestStatus != null ? new DeviceStatusDetailDto
                    {
                        CpuUsage = latestStatus.CpuUsage,
                        MemoryUsedKb = latestStatus.MemoryUsedKb,
                        MemoryTotalKb = latestStatus.MemoryTotalKb,
                        UptimeSeconds = latestStatus.UptimeSeconds,
                        TemperatureInternal = latestStatus.TemperatureInternal,
                        WifiRssi = latestStatus.WifiRssi,
                        ErrorCount = latestStatus.ErrorCount,
                        WarningCount = latestStatus.WarningCount,
                        Timestamp = latestStatus.Timestamp
                    } : null
                };

                return Ok(deviceDetail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device detail for {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Sensor Readings and Metrics

        /// <summary>
        /// Get latest sensor readings for a device
        /// </summary>
        [HttpGet("devices/{deviceId}/sensors/latest")]
        public async Task<ActionResult<List<SensorReadingDto>>> GetLatestSensorReadings([FromRoute] Guid deviceId)
        {
            try
            {
                // Subquery with ROW_NUMBER() that EF Core translates better
                var latestReadings = await _context.SensorReadings
                    .Where(sr => sr.DeviceId == deviceId)
                    .Include(sr => sr.SensorType)
                    .Where(sr => _context.SensorReadings
                        .Where(sr2 => sr2.DeviceId == deviceId && sr2.SensorTypeId == sr.SensorTypeId)
                        .OrderByDescending(sr2 => sr2.Timestamp)
                        .Select(sr2 => sr2.ReadingId)
                        .First() == sr.ReadingId)
                    .Select(sr => new SensorReadingDto
                    {
                        ReadingId = sr.ReadingId,
                        SensorTypeName = sr.SensorType.SensorName,
                        Unit = sr.SensorType.Unit,
                        RawValue = sr.RawValue,
                        CalibratedValue = sr.CalibratedValue,
                        Timestamp = sr.Timestamp,
                        QualityScore = sr.QualityScore
                    })
                    .ToListAsync();

                return Ok(latestReadings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting latest sensor readings for device {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }
        /// <summary>
        /// Get sensor readings history for a device within a time range
        /// </summary>
        [HttpGet("devices/{deviceId}/sensors/history")]
        public async Task<ActionResult<List<SensorReadingDto>>> GetSensorReadingsHistory(
            [FromRoute] Guid deviceId,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] string? sensorType = "actuator",
            [FromQuery] int limit = 1000)
        {
            try
            {
                // If there is no parameters 24hrs by default
                var endDate = to ?? DateTime.UtcNow;
                var startDate = from ?? endDate.AddDays(-1);

                // Ensure UTC
                var fromUtc = EnsureUtc(startDate);
                var toUtc = EnsureUtc(endDate);

                var readings = await _context.SensorReadings
                .Where(sr => sr.DeviceId == deviceId &&
                            sr.Timestamp >= fromUtc &&
                            sr.Timestamp <= toUtc)
                .Where(sr => string.IsNullOrEmpty(sensorType) || sr.SensorType.SensorName == sensorType)
                .OrderByDescending(sr => sr.Timestamp)
                .Take(limit)
                .Select(sr => new SensorReadingDto
                {
                    ReadingId = sr.ReadingId,
                    SensorTypeName = sr.SensorType.SensorName,
                    Unit = sr.SensorType.Unit,
                    RawValue = sr.RawValue,
                    CalibratedValue = sr.CalibratedValue,
                    Timestamp = sr.Timestamp,
                    QualityScore = sr.QualityScore
                })
                .ToListAsync();

                return Ok(readings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sensor readings history for device {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get aggregated sensor metrics for a device
        /// </summary>
        [HttpGet("devices/{deviceId}/sensors/metrics")]
        public async Task<ActionResult<List<SensorMetricsDto>>> GetDeviceSensorMetrics(
            [FromRoute] Guid deviceId,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to)
        {
            try
            {
                from = EnsureUtc(from);
                to = EnsureUtc(to);

                var metrics = await _context.SensorReadings
                    .Where(sr => sr.DeviceId == deviceId && sr.Timestamp >= from && sr.Timestamp <= to)
                    .Include(sr => sr.SensorType)
                    .GroupBy(sr => new { sr.SensorTypeId, sr.SensorType.SensorName, sr.SensorType.Unit })
                    .Select(g => new SensorMetricsDto
                    {
                        SensorTypeName = g.Key.SensorName,
                        Unit = g.Key.Unit,
                        Count = g.Count(),
                        AvgValue = g.Average(sr => sr.CalibratedValue ?? sr.RawValue),
                        MinValue = g.Min(sr => sr.CalibratedValue ?? sr.RawValue),
                        MaxValue = g.Max(sr => sr.CalibratedValue ?? sr.RawValue),
                        AvgQuality = g.Average(sr => sr.QualityScore ?? 1.0m),
                        FirstReading = g.Min(sr => sr.Timestamp),
                        LastReading = g.Max(sr => sr.Timestamp)
                    })
                    .ToListAsync();

                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sensor metrics for device {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Device Status and Health

        /// <summary>
        /// Get device status history
        /// </summary>
        [HttpGet("devices/{deviceId}/status/history")]
        public async Task<ActionResult<List<DeviceStatusDetailDto>>> GetDeviceStatusHistory(
            [FromRoute] Guid deviceId,
            [FromQuery] DateTime from,
            [FromQuery] DateTime to,
            [FromQuery] int limit = 500)
        {
            try
            {
                from = EnsureUtc(from);
                to = EnsureUtc(to);

                var statusHistory = await _context.DeviceStatus
                    .Where(ds => ds.DeviceId == deviceId && ds.Timestamp >= from && ds.Timestamp <= to)
                    .OrderByDescending(ds => ds.Timestamp)
                    .Take(limit)
                    .Select(ds => new DeviceStatusDetailDto
                    {
                        CpuUsage = ds.CpuUsage,
                        MemoryUsedKb = ds.MemoryUsedKb,
                        MemoryTotalKb = ds.MemoryTotalKb,
                        UptimeSeconds = ds.UptimeSeconds,
                        TemperatureInternal = ds.TemperatureInternal,
                        WifiRssi = ds.WifiRssi,
                        ErrorCount = ds.ErrorCount,
                        WarningCount = ds.WarningCount,
                        Timestamp = ds.Timestamp
                    })
                    .ToListAsync();

                return Ok(statusHistory);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device status history for {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get device health summary
        /// </summary>
        [HttpGet("devices/{deviceId}/health")]
        public async Task<ActionResult<DeviceHealthDto>> GetDeviceHealth([FromRoute] Guid deviceId)
        {
            try
            {
                var device = await _context.Esp32Devices.FindAsync(deviceId);
                if (device == null)
                    return NotFound($"Device with ID {deviceId} not found");

                var last24Hours = DateTime.UtcNow.AddDays(-1);

                // Get status metrics from last 24 hours
                var statusMetrics = await _context.DeviceStatus
                    .Where(ds => ds.DeviceId == deviceId && ds.Timestamp >= last24Hours)
                    .GroupBy(ds => 1)
                    .Select(g => new
                    {
                        AvgCpuUsage = g.Average(ds => ds.CpuUsage ?? 0),
                        MaxCpuUsage = g.Max(ds => ds.CpuUsage ?? 0),
                        AvgMemoryUsage = g.Average(ds => ds.MemoryUsedKb ?? 0),
                        MaxMemoryUsage = g.Max(ds => ds.MemoryUsedKb ?? 0),
                        AvgTemperature = g.Average(ds => ds.TemperatureInternal ?? 0),
                        MaxTemperature = g.Max(ds => ds.TemperatureInternal ?? 0),
                        AvgWifiRssi = g.Average(ds => ds.WifiRssi ?? -100),
                        TotalErrors = g.Sum(ds => ds.ErrorCount ?? 0),
                        TotalWarnings = g.Sum(ds => ds.WarningCount ?? 0),
                        Count = g.Count()
                    })
                    .FirstOrDefaultAsync();

                // Get sensor readings count
                var readingsCount = await _context.SensorReadings
                    .CountAsync(sr => sr.DeviceId == deviceId && sr.Timestamp >= last24Hours);

                // Get active alerts
                var activeAlerts = await _context.DeviceAlerts
                    .CountAsync(da => da.DeviceId == deviceId && !da.IsResolved);

                // Calculate health score (0-100)
                var healthScore = CalculateHealthScore(device, statusMetrics, activeAlerts);

                var health = new DeviceHealthDto
                {
                    DeviceId = deviceId,
                    HealthScore = healthScore,
                    IsOnline = device.IsOnline,
                    LastSeen = device.LastSeen,
                    BatteryLevel = device.BatteryLevel,
                    StatusReportsLast24h = statusMetrics?.Count ?? 0,
                    SensorReadingsLast24h = readingsCount,
                    ActiveAlerts = activeAlerts,
                    AvgCpuUsage = statusMetrics?.AvgCpuUsage ?? 0,
                    MaxCpuUsage = statusMetrics?.MaxCpuUsage ?? 0,
                    AvgMemoryUsageMb = (statusMetrics?.AvgMemoryUsage ?? 0) / 1024,
                    MaxMemoryUsageMb = (statusMetrics?.MaxMemoryUsage ?? 0) / 1024,
                    AvgTemperature = statusMetrics?.AvgTemperature ?? 0,
                    MaxTemperature = statusMetrics?.MaxTemperature ?? 0,
                    AvgWifiRssi = (int)(statusMetrics?.AvgWifiRssi ?? -100),
                    TotalErrors = statusMetrics?.TotalErrors ?? 0,
                    TotalWarnings = statusMetrics?.TotalWarnings ?? 0
                };

                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting device health for {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Swarm Metrics

        /// <summary>
        /// Get metrics for all devices in a swarm
        /// </summary>
        [HttpGet("swarms/{swarmId}/metrics")]
        public async Task<ActionResult<SwarmMetricsDto>> GetSwarmMetrics([FromRoute] Guid swarmId)
        {
            try
            {
                var swarm = await _context.DeviceSwarms.FindAsync(swarmId);
                if (swarm == null)
                    return NotFound($"Swarm with ID {swarmId} not found");

                var devices = await _context.Esp32Devices
                    .Where(d => d.SwarmId == swarmId)
                    .ToListAsync();

                if (!devices.Any())
                {
                    return Ok(new SwarmMetricsDto
                    {
                        SwarmId = swarmId,
                        SwarmName = swarm.SwarmName,
                        TotalDevices = 0,
                        OnlineDevices = 0,
                        OfflineDevices = 0
                    });
                }

                var last24Hours = DateTime.UtcNow.AddDays(-1);
                var deviceIds = devices.Select(d => d.DeviceId).ToList();

                // Get aggregated metrics
                var totalReadings = await _context.SensorReadings
                    .CountAsync(sr => deviceIds.Contains(sr.DeviceId) && sr.Timestamp >= last24Hours);

                var avgBatteryLevel = devices.Where(d => d.BatteryLevel.HasValue)
                    .Average(d => d.BatteryLevel ?? 0);

                var activeAlerts = await _context.DeviceAlerts
                    .CountAsync(da => deviceIds.Contains(da.DeviceId) && !da.IsResolved);

                var swarmMetrics = new SwarmMetricsDto
                {
                    SwarmId = swarmId,
                    SwarmName = swarm.SwarmName,
                    TotalDevices = devices.Count,
                    OnlineDevices = devices.Count(d => d.IsOnline),
                    OfflineDevices = devices.Count(d => !d.IsOnline),
                    AvgBatteryLevel = (decimal)avgBatteryLevel,
                    TotalSensorReadings24h = totalReadings,
                    ActiveAlerts = activeAlerts,
                    LastActivity = swarm.UpdatedAt,
                    Status = swarm.Status ?? "unknown"
                };

                return Ok(swarmMetrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting swarm metrics for {SwarmId}", swarmId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get all swarms with basic metrics
        /// </summary>
        [HttpGet("swarms")]
        public async Task<ActionResult<List<SwarmSummaryDto>>> GetAllSwarms()
        {
            try
            {
                var swarms = await _context.DeviceSwarms
                    .Where(s => s.IsActive)
                    .Select(s => new SwarmSummaryDto
                    {
                        SwarmId = s.SwarmId,
                        SwarmName = s.SwarmName,
                        Description = s.Description,
                        MaxDevices = s.MaxDevices,
                        Status = s.Status ?? "unknown",
                        CreatedAt = s.CreatedAt,
                        Location = s.Location,
                        DeviceCount = s.Devices.Count(),
                        OnlineDeviceCount = s.Devices.Count(d => d.IsOnline)
                    })
                    .ToListAsync();

                return Ok(swarms);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting swarms list");
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Alerts and Notifications

        /// <summary>
        /// Get active alerts for a device
        /// </summary>
        [HttpGet("devices/{deviceId}/alerts")]
        public async Task<ActionResult<List<DeviceAlertDto>>> GetDeviceAlerts(
            [FromRoute] Guid deviceId,
            [FromQuery] bool activeOnly = true)
        {
            try
            {
                var query = _context.DeviceAlerts.Where(da => da.DeviceId == deviceId);

                if (activeOnly)
                    query = query.Where(da => !da.IsResolved);

                var alerts = await query
                    .OrderByDescending(da => da.CreatedAt)
                    .Select(da => new DeviceAlertDto
                    {
                        AlertId = da.AlertId,
                        AlertType = da.AlertType,
                        Severity = da.Severity ?? "medium",
                        Title = da.Title,
                        Description = da.Description,
                        ThresholdValue = da.ThresholdValue,
                        ActualValue = da.ActualValue,
                        IsResolved = da.IsResolved,
                        CreatedAt = da.CreatedAt,
                        ResolvedAt = da.ResolvedAt
                    })
                    .ToListAsync();

                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting alerts for device {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get all active alerts across all devices
        /// </summary>
        [HttpGet("alerts")]
        public async Task<ActionResult<List<DeviceAlertWithDeviceDto>>> GetAllActiveAlerts(
            [FromQuery] string? severity = null,
            [FromQuery] string? alertType = null)
        {
            try
            {
                var query = _context.DeviceAlerts
                    .Where(da => !da.IsResolved)
                    .Include(da => da.Device);

                if (!string.IsNullOrEmpty(severity))
                    query = (Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<DeviceAlert, Esp32Device>)query.Where(da => da.Severity == severity);

                if (!string.IsNullOrEmpty(alertType))
                    query = (Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<DeviceAlert, Esp32Device>)query.Where(da => da.AlertType == alertType);

                var alerts = await query
                    .OrderByDescending(da => da.CreatedAt)
                    .Select(da => new DeviceAlertWithDeviceDto
                    {
                        AlertId = da.AlertId,
                        DeviceId = da.DeviceId,
                        DeviceName = da.Device.DeviceName,
                        AlertType = da.AlertType,
                        Severity = da.Severity ?? "medium",
                        Title = da.Title,
                        Description = da.Description,
                        ThresholdValue = da.ThresholdValue,
                        ActualValue = da.ActualValue,
                        CreatedAt = da.CreatedAt
                    })
                    .ToListAsync();

                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all active alerts");
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Network Logs

        /// <summary>
        /// Get network connectivity logs for a device
        /// </summary>
        [HttpGet("devices/{deviceId}/network")]
        public async Task<ActionResult<List<NetworkLogDto>>> GetDeviceNetworkLogs(
            [FromRoute] Guid deviceId,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null,
            [FromQuery] int limit = 100)
        {
            try
            {
                var query = _context.NetworkLogs.Where(nl => nl.DeviceId == deviceId);

                if (from.HasValue)
                    query = query.Where(nl => nl.ConnectedAt >= EnsureUtc(from.Value));

                if (to.HasValue)
                    query = query.Where(nl => nl.ConnectedAt <= EnsureUtc(to.Value));

                var networkLogs = await query
                    .OrderByDescending(nl => nl.ConnectedAt)
                    .Take(limit)
                    .Select(nl => new NetworkLogDto
                    {
                        LogId = nl.LogId,
                        IpAddress = nl.IpAddress.ToString(),
                        ConnectionType = nl.ConnectionType ?? "WiFi",
                        SignalStrength = nl.SignalStrength,
                        NetworkName = nl.NetworkName,
                        ConnectedAt = nl.ConnectedAt,
                        DisconnectedAt = nl.DisconnectedAt,
                        DurationSeconds = nl.DurationSeconds,
                        DataUploadedKb = nl.DataUploadedKb,
                        DataDownloadedKb = nl.DataDownloadedKb
                    })
                    .ToListAsync();

                return Ok(networkLogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting network logs for device {DeviceId}", deviceId);
                return StatusCode(500, "Internal server error");
            }
        }

        #endregion

        #region Helper Methods

        private static DateTime EnsureUtc(DateTime dateTime)
        {
            return dateTime.Kind switch
            {
                DateTimeKind.Utc => dateTime,
                DateTimeKind.Local => dateTime.ToUniversalTime(),
                DateTimeKind.Unspecified => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc),
                _ => dateTime
            };
        }

        private static decimal CalculateHealthScore(Esp32Device device, dynamic statusMetrics, int activeAlerts)
        {
            decimal score = 100;

            // Device online status (30 points)
            if (!device.IsOnline)
                score -= 30;

            // Battery level (20 points)
            if (device.BatteryLevel.HasValue)
            {
                if (device.BatteryLevel < 20)
                    score -= 20;
                else if (device.BatteryLevel < 50)
                    score -= 10;
            }

            // Active alerts (20 points)
            score -= Math.Min(20, activeAlerts * 5);

            // Status metrics (30 points)
            if (statusMetrics != null)
            {
                // CPU usage
                if (statusMetrics.AvgCpuUsage > 80)
                    score -= 10;
                else if (statusMetrics.AvgCpuUsage > 60)
                    score -= 5;

                // Temperature
                if (statusMetrics.AvgTemperature > 70)
                    score -= 10;
                else if (statusMetrics.AvgTemperature > 60)
                    score -= 5;

                // Errors and warnings
                if (statusMetrics.TotalErrors > 0)
                    score -= Math.Min(10, statusMetrics.TotalErrors);
            }

            return Math.Max(0, Math.Min(100, score));
        }

        #endregion
    }
}

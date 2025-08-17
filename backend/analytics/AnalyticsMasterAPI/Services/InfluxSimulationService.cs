using AnalyticsPSQL_MasterApi.Data;
using AnalyticsPSQL_MasterApi.DTOs;
using AnalyticsPSQL_MasterApi.Infrastructure;
using AnalyticsPSQL_MasterApi.Models;
using InfluxDB.Client;
using InfluxDB.Client.Core.Flux.Domain;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AnalyticsPSQL_MasterApi.Services
{
    public class InfluxSimulationService : IInfluxSimulationService
    {
        private readonly IInfluxDBClient _influxClient;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InfluxSimulationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly Random _random;

        public InfluxSimulationService(
            IInfluxDBClient influxClient,
            ApplicationDbContext context,
            ILogger<InfluxSimulationService> logger,
            IConfiguration configuration)
        {
            _influxClient = influxClient;
            _context = context;
            _logger = logger;
            _configuration = configuration;
            _random = new Random();
        }

        public async Task<List<InfluxIoTData>> ReadIoTDataFromInfluxAsync(DateTime from, DateTime to)
        {
            // Ensure UTC for InfluxDB query
            from = EnsureUtc(from);
            to = EnsureUtc(to);

            var bucket = _configuration["InfluxDb:Bucket"] ?? "data-iot";
            var org = _configuration["InfluxDb:Org"] ?? "my-org";

            // Query with date range
            var query = $@"
              from(bucket: ""{bucket}"")
                |> range(start: {from:yyyy-MM-ddTHH:mm:ssZ}, stop: {to:yyyy-MM-ddTHH:mm:ssZ})
                |> filter(fn: (r) => r[""_measurement""] == ""iot_telemetry"")
                |> filter(fn: (r) => r[""_field""] == ""actuator"" or 
                                   r[""_field""] == ""humidity"" or 
                                   r[""_field""] == ""temperature"" or 
                                   r[""_field""] == ""version"" or 
                                   r[""_field""] == ""timestamp"")
                |> filter(fn: (r) => r[""format""] == ""json"")
                |> filter(fn: (r) => r[""source""] == ""iot-parser"")
                |> filter(fn: (r) => r[""topic""] == ""IDGS10-Pruebas-Sensores"")
                |> filter(fn: (r) => r[""version""] == ""1.0.0"")
                |> map(fn: (r) => ({{
                    r with _field: if r._field == ""version"" then ""device_version"" else r._field
                }}))
                |> pivot(rowKey: [""_time""], columnKey: [""_field""], valueColumn: ""_value"")
            ";

            var queryApi = _influxClient.GetQueryApi();
            var results = new List<InfluxIoTData>();

            try
            {
                var tables = await queryApi.QueryAsync(query, org);

                foreach (var table in tables)
                {
                    foreach (var record in table.Records)
                    {
                        var recordTime = record.GetTime()?.ToDateTimeUtc() ?? DateTime.UtcNow;
                        var data = new InfluxIoTData
                        {
                            Time = EnsureUtc(recordTime),
                            Topic = record.GetValueByKey("topic")?.ToString() ?? "",
                            Source = record.GetValueByKey("source")?.ToString() ?? "",
                            Format = record.GetValueByKey("format")?.ToString() ?? "",
                            Version = record.GetValueByKey("version")?.ToString() ?? "",
                            Temperature = GetDoubleValue(record, "temperature"),
                            Humidity = GetDoubleValue(record, "humidity"),
                            Actuator = GetDoubleValue(record, "actuator"),
                            DeviceVersion = record.GetValueByKey("version")?.ToString(),
                            DeviceTimestamp = GetDateTimeValue(record, "timestamp")
                        };

                        results.Add(data);
                    }
                }

                _logger.LogInformation($"Leídos {results.Count} registros de InfluxDB para el rango {from} - {to}");
                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leyendo datos de InfluxDB");
                throw;
            }
        }

        public async Task<List<Esp32DeviceInfo>> GetActiveDevicesAsync()
        {
            return await _context.Esp32Devices
                .Where(d => d.Status == "assigned" || d.Status == "active")
                .Select(d => new Esp32DeviceInfo
                {
                    DeviceId = d.DeviceId,
                    DeviceName = d.DeviceName,
                    DeviceType = d.DeviceType,
                    Location = d.Location ?? "",
                    IsOnline = d.IsOnline
                })
                .ToListAsync();
        }

        public async Task SimulateMetricsForDevicesAsync(DateTime from, DateTime to)
        {
            try
            {
                // Ensure UTC for all dates
                from = EnsureUtc(from);
                to = EnsureUtc(to);

                // 1. Get InfluxDB data
                var influxData = await ReadIoTDataFromInfluxAsync(from, to);
                if (!influxData.Any())
                {
                    _logger.LogWarning("No se encontraron datos en InfluxDB para simular");
                    return;
                }

                // 2. Get all active ESP32 
                var devices = await GetActiveDevicesAsync();
                if (!devices.Any())
                {
                    _logger.LogWarning("No se encontraron dispositivos ESP32 activos");
                    return;
                }

                _logger.LogInformation($"Simulando métricas para {devices.Count} dispositivos con {influxData.Count} registros de InfluxDB");

                // 3. Simular lecturas de sensores
                await SimulateSensorReadingsAsync(devices, influxData);

                // 4. Simular métricas por hora
                await SimulateHourlyMetricsAsync(devices, from, to);

                // 5. Simular estados de dispositivos
                await SimulateDeviceStatusAsync(devices, influxData);

                _logger.LogInformation("Simulación de métricas completada exitosamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante la simulación de métricas");
                throw;
            }
        }

        private async Task SimulateSensorReadingsAsync(List<Esp32DeviceInfo> devices, List<InfluxIoTData> influxData)
        {
            await EnsureSensorTypesExistAsync();

            var tempSensorType = await _context.SensorTypes.FirstAsync(st => st.SensorName == "temperature");
            var humiditySensorType = await _context.SensorTypes.FirstAsync(st => st.SensorName == "humidity");
            var actuatorSensorType = await _context.SensorTypes.FirstAsync(st => st.SensorName == "actuator");

            var readings = new List<SensorReading>();

            foreach (var influxReading in influxData)
            {
                var randomDevice = devices[_random.Next(devices.Count)];

                if (influxReading.Temperature.HasValue)
                {
                    readings.Add(CreateSensorReading(
                        randomDevice.DeviceId,
                        tempSensorType.SensorTypeId,
                        (decimal)influxReading.Temperature.Value,
                        EnsureUtc(influxReading.Time)
                    ));
                }

                if (influxReading.Humidity.HasValue)
                {
                    readings.Add(CreateSensorReading(
                        randomDevice.DeviceId,
                        humiditySensorType.SensorTypeId,
                        (decimal)influxReading.Humidity.Value,
                        EnsureUtc(influxReading.Time)
                    ));
                }

                if (influxReading.Actuator.HasValue)
                {
                    readings.Add(CreateSensorReading(
                        randomDevice.DeviceId,
                        actuatorSensorType.SensorTypeId,
                        (decimal)influxReading.Actuator.Value,
                        EnsureUtc(influxReading.Time)
                    ));
                }
            }

            // Usar INSERT ... ON CONFLICT DO NOTHING (PostgreSQL específico)
            var batchSize = 1000;
            for (int i = 0; i < readings.Count; i += batchSize)
            {
                var batch = readings.Skip(i).Take(batchSize).ToList();

                try
                {
                    // Usar AddRange con configuración de conflictos
                    foreach (var reading in batch)
                    {
                        // Verificar si existe usando una consulta simple
                        var exists = await _context.SensorReadings
                            .AnyAsync(sr => sr.DeviceId == reading.DeviceId &&
                                          sr.Timestamp == reading.Timestamp &&
                                          sr.SensorTypeId == reading.SensorTypeId);

                        if (!exists)
                        {
                            _context.SensorReadings.Add(reading);
                        }
                    }

                    await _context.SaveChangesAsync();
                    _logger.LogDebug($"Procesado batch de {batch.Count} lecturas");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Error en batch, insertando individualmente");

                    // Fallback: insertar uno por uno
                    foreach (var reading in batch)
                    {
                        try
                        {
                            var exists = await _context.SensorReadings
                                .AnyAsync(sr => sr.DeviceId == reading.DeviceId &&
                                              sr.Timestamp == reading.Timestamp &&
                                              sr.SensorTypeId == reading.SensorTypeId);

                            if (!exists)
                            {
                                _context.SensorReadings.Add(reading);
                                await _context.SaveChangesAsync();
                            }
                        }
                        catch (Exception individualEx)
                        {
                            _logger.LogError(individualEx, $"Error insertando lectura individual para dispositivo {reading.DeviceId}");
                        }
                    }
                }
            }

            _logger.LogInformation($"Total de lecturas de sensores procesadas: {readings.Count}");
        }

        private async Task SimulateHourlyMetricsAsync(List<Esp32DeviceInfo> devices, DateTime from, DateTime to)
        {
            // Ensure UTC and create proper hour boundaries
            from = EnsureUtc(from);
            to = EnsureUtc(to);

            var currentHour = new DateTime(from.Year, from.Month, from.Day, from.Hour, 0, 0, DateTimeKind.Utc);
            var endHour = new DateTime(to.Year, to.Month, to.Day, to.Hour, 0, 0, DateTimeKind.Utc);

            while (currentHour <= endHour)
            {
                foreach (var device in devices)
                {
                    // Simulate hourly metrics
                    await CreateDeviceHourlyMetric(device, currentHour);

                    // Simulate sensor hourly metrics
                    await CreateSensorHourlyMetrics(device, currentHour);
                }

                currentHour = currentHour.AddHours(1);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Métricas por hora simuladas exitosamente");
        }

        private async Task SimulateDeviceStatusAsync(List<Esp32DeviceInfo> devices, List<InfluxIoTData> influxData)
        {
            var statusEntries = new List<DeviceStatus>();

            // Crear entradas de estado basadas en los timestamps de InfluxDB
            var timeGroups = influxData.GroupBy(d =>
            {
                var utcTime = EnsureUtc(d.Time);
                return new DateTime(utcTime.Year, utcTime.Month, utcTime.Day, utcTime.Hour, 0, 0, DateTimeKind.Utc);
            });

            foreach (var timeGroup in timeGroups)
            {
                foreach (var device in devices)
                {
                    var randomMinutes = _random.Next(0, 59);
                    var statusTimestamp = timeGroup.Key.AddMinutes(randomMinutes);

                    var status = new DeviceStatus
                    {
                        StatusId = Guid.NewGuid(),
                        DeviceId = device.DeviceId,
                        CpuUsage = (decimal)(_random.NextDouble() * 80 + 10), // 10-90%
                        MemoryUsedKb = _random.Next(50000, 200000),
                        MemoryTotalKb = 320000, // ESP32 típico
                        UptimeSeconds = _random.Next(3600, 86400), // 1-24 horas
                        TemperatureInternal = (decimal)(_random.NextDouble() * 30 + 40), // 40-70°C
                        WifiRssi = _random.Next(-80, -30), // RSSI típico
                        ErrorCount = _random.Next(0, 5),
                        WarningCount = _random.Next(0, 10),
                        Timestamp = EnsureUtc(statusTimestamp)
                    };

                    statusEntries.Add(status);
                }
            }

            // Verificar duplicados y insertar
            var deviceIds = statusEntries.Select(se => se.DeviceId).Distinct().ToList();
            var dates = statusEntries.Select(se => se.Timestamp.Date).Distinct().ToList();
            var hours = statusEntries.Select(se => se.Timestamp.Hour).Distinct().ToList();

            var existingStatuses = await _context.DeviceStatus
                .Where(ds => deviceIds.Contains(ds.DeviceId) &&
                            dates.Contains(ds.Timestamp.Date) &&
                            hours.Contains(ds.Timestamp.Hour))
                .Select(ds => new { ds.DeviceId, Date = ds.Timestamp.Date, Hour = ds.Timestamp.Hour })
                .ToListAsync();

            var newStatuses = statusEntries.Where(se => !existingStatuses.Any(es =>
                es.DeviceId == se.DeviceId &&
                es.Date == se.Timestamp.Date &&
                es.Hour == se.Timestamp.Hour)).ToList();

            if (newStatuses.Any())
            {
                _context.DeviceStatus.AddRange(newStatuses);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Creadas {newStatuses.Count} entradas de estado de dispositivos");
            }
        }

        private async Task EnsureSensorTypesExistAsync()
        {
            var sensorTypes = new[]
            {
            new { Name = "temperature", Unit = "°C", Description = "Temperature sensor" },
            new { Name = "humidity", Unit = "%", Description = "Humidity sensor" },
            new { Name = "actuator", Unit = "state", Description = "Actuator status" }
        };

            foreach (var sensorTypeInfo in sensorTypes)
            {
                var exists = await _context.SensorTypes.AnyAsync(st => st.SensorName == sensorTypeInfo.Name);
                if (!exists)
                {
                    var sensorType = new SensorType
                    {
                        SensorName = sensorTypeInfo.Name,
                        Unit = sensorTypeInfo.Unit,
                        Description = sensorTypeInfo.Description,
                        PrecisionDigits = 2
                    };

                    _context.SensorTypes.Add(sensorType);
                }
            }

            await _context.SaveChangesAsync();
        }

        private SensorReading CreateSensorReading(Guid deviceId, int sensorTypeId, decimal value, DateTime timestamp)
        {
            return new SensorReading
            {
                ReadingId = Guid.NewGuid(),
                DeviceId = deviceId,
                SensorTypeId = sensorTypeId,
                RawValue = value,
                CalibratedValue = value + (decimal)(_random.NextDouble() * 0.1 - 0.05), // Pequeña variación
                Timestamp = EnsureUtc(timestamp),
                QualityScore = (decimal)(_random.NextDouble() * 0.1 + 0.9), // 0.9 - 1.0
                Metadata = JsonSerializer.Serialize(new { source = "influx_simulation" })
            };
        }

        private async Task CreateDeviceHourlyMetric(Esp32DeviceInfo device, DateTime hourTimestamp)
        {
            hourTimestamp = EnsureUtc(hourTimestamp);

            var exists = await _context.DeviceMetricsHourly
                .AnyAsync(dm => dm.DeviceId == device.DeviceId && dm.HourTimestamp == hourTimestamp);

            if (!exists)
            {
                var utcNow = DateTime.UtcNow;
                var metric = new DeviceMetricHourly
                {
                    MetricId = Guid.NewGuid(),
                    DeviceId = device.DeviceId,
                    HourTimestamp = hourTimestamp,
                    UptimePercentage = device.IsOnline ? (decimal)(_random.NextDouble() * 20 + 80) : (decimal)(_random.NextDouble() * 30), // 80-100% si online
                    AvgSignalStrength = _random.Next(-80, -30),
                    ConnectionDrops = _random.Next(0, 3),
                    DataTransmittedKb = (decimal)(_random.NextDouble() * 100 + 10),
                    DataReceivedKb = (decimal)(_random.NextDouble() * 50 + 5),
                    AvgCpuUsage = (decimal)(_random.NextDouble() * 60 + 20),
                    MaxCpuUsage = (decimal)(_random.NextDouble() * 30 + 70),
                    AvgMemoryUsage = (decimal)(_random.NextDouble() * 40 + 40),
                    MaxMemoryUsage = (decimal)(_random.NextDouble() * 20 + 70),
                    AvgInternalTemperature = (decimal)(_random.NextDouble() * 20 + 45),
                    MaxInternalTemperature = (decimal)(_random.NextDouble() * 10 + 60),
                    ErrorCount = _random.Next(0, 5),
                    WarningCount = _random.Next(0, 10),
                    ReadingCount = _random.Next(50, 200),
                    FailedReadingCount = _random.Next(0, 5),
                    AvgBatteryLevel = device.IsOnline ? (decimal)(_random.NextDouble() * 40 + 60) : (decimal)(_random.NextDouble() * 50 + 10),
                    MinBatteryLevel = device.IsOnline ? (decimal)(_random.NextDouble() * 30 + 50) : (decimal)(_random.NextDouble() * 40 + 5),
                    AvgDataQuality = (decimal)(_random.NextDouble() * 0.2 + 0.8),
                    OutOfRangeReadings = _random.Next(0, 10),
                    CreatedAt = utcNow,
                    UpdatedAt = utcNow
                };

                _context.DeviceMetricsHourly.Add(metric);
            }
        }

        private async Task CreateSensorHourlyMetrics(Esp32DeviceInfo device, DateTime hourTimestamp)
        {
            hourTimestamp = EnsureUtc(hourTimestamp);

            var sensorTypes = await _context.SensorTypes
                .Where(st => st.SensorName == "temperature" || st.SensorName == "humidity" || st.SensorName == "actuator")
                .ToListAsync();

            foreach (var sensorType in sensorTypes)
            {
                var exists = await _context.SensorMetricsHourly
                    .AnyAsync(sm => sm.DeviceId == device.DeviceId &&
                                  sm.SensorTypeId == sensorType.SensorTypeId &&
                                  sm.HourTimestamp == hourTimestamp);

                if (!exists)
                {
                    var baseValue = sensorType.SensorName switch
                    {
                        "temperature" => _random.NextDouble() * 15 + 20, // 20-35°C
                        "humidity" => _random.NextDouble() * 40 + 40,    // 40-80%
                        "actuator" => _random.NextDouble() * 1,          // 0-1
                        _ => _random.NextDouble() * 100
                    };

                    var utcNow = DateTime.UtcNow;
                    var metric = new SensorMetricHourly
                    {
                        MetricId = Guid.NewGuid(),
                        DeviceId = device.DeviceId,
                        SensorTypeId = sensorType.SensorTypeId,
                        HourTimestamp = hourTimestamp,
                        ReadingCount = _random.Next(50, 200),
                        AvgValue = (decimal)baseValue,
                        MinValue = (decimal)(baseValue - _random.NextDouble() * 5),
                        MaxValue = (decimal)(baseValue + _random.NextDouble() * 5),
                        MedianValue = (decimal)(baseValue + _random.NextDouble() * 2 - 1),
                        StddevValue = (decimal)(_random.NextDouble() * 2),
                        VarianceValue = (decimal)(_random.NextDouble() * 4),
                        Percentile25 = (decimal)(baseValue - _random.NextDouble() * 2),
                        Percentile75 = (decimal)(baseValue + _random.NextDouble() * 2),
                        Percentile95 = (decimal)(baseValue + _random.NextDouble() * 4),
                        Percentile99 = (decimal)(baseValue + _random.NextDouble() * 5),
                        TrendDirection = new[] { "increasing", "decreasing", "stable" }[_random.Next(3)],
                        RateOfChange = (decimal)(_random.NextDouble() * 0.1 - 0.05),
                        VolatilityScore = (decimal)(_random.NextDouble() * 30 + 10),
                        AvgQualityScore = (decimal)(_random.NextDouble() * 0.2 + 0.8),
                        OutOfRangeCount = _random.Next(0, 5),
                        AnomalyCount = _random.Next(0, 3),
                        GapCount = _random.Next(0, 2),
                        AboveThresholdCount = _random.Next(0, 10),
                        BelowThresholdCount = _random.Next(0, 5),
                        ThresholdViolationDurationMinutes = _random.Next(0, 30),
                        CreatedAt = utcNow,
                        UpdatedAt = utcNow
                    };

                    _context.SensorMetricsHourly.Add(metric);
                }
            }
        }

        /// <summary>
        /// Ensures a DateTime has UTC kind. Converts Unspecified to UTC, keeps UTC as-is.
        /// </summary>
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

        private double? GetDoubleValue(FluxRecord record, string field)
        {
            var value = record.GetValueByKey(field);
            if (value != null && double.TryParse(value.ToString(), out double result))
            {
                return result;
            }
            return null;
        }

        private DateTime? GetDateTimeValue(FluxRecord record, string field)
        {
            var value = record.GetValueByKey(field);
            if (value != null && DateTime.TryParse(value.ToString(), out DateTime result))
            {
                return EnsureUtc(result);
            }
            return null;
        }
    }
}
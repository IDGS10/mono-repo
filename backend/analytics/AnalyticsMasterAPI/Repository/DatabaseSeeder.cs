using AnalyticsPSQL_MasterApi.Data;
using AnalyticsPSQL_MasterApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsPSQL_MasterApi.Repository
{
    public class DatabaseSeeder
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DatabaseSeeder> _logger;

        public DatabaseSeeder(ApplicationDbContext context, ILogger<DatabaseSeeder> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedAsync()
        {
            try
            {
                // Crear tipos de sensores si no existen
                await SeedSensorTypesAsync();

                // Los dispositivos ESP32 ya existen según el JSON proporcionado
                // Verificar que estén en la base de datos
                await VerifyDevicesAsync();

                _logger.LogInformation("Database seeding completado");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error durante database seeding");
                throw;
            }
        }

        private async Task SeedSensorTypesAsync()
        {
            var sensorTypes = new[]
            {
            new SensorType { SensorName = "temperature", Unit = "°C", Description = "Temperature sensor", MinValue = -40, MaxValue = 125, PrecisionDigits = 2 },
            new SensorType { SensorName = "humidity", Unit = "%", Description = "Humidity sensor", MinValue = 0, MaxValue = 100, PrecisionDigits = 1 },
            new SensorType { SensorName = "actuator", Unit = "state", Description = "Actuator status", MinValue = 0, MaxValue = 1, PrecisionDigits = 0 },
            new SensorType { SensorName = "pressure", Unit = "hPa", Description = "Pressure sensor", MinValue = 300, MaxValue = 1100, PrecisionDigits = 2 },
            new SensorType { SensorName = "voltage", Unit = "V", Description = "Voltage sensor", MinValue = 0, MaxValue = 5, PrecisionDigits = 3 }
        };

            foreach (var sensorType in sensorTypes)
            {
                var exists = await _context.SensorTypes.AnyAsync(st => st.SensorName == sensorType.SensorName);
                if (!exists)
                {
                    _context.SensorTypes.Add(sensorType);
                }
            }

            await _context.SaveChangesAsync();
        }

        private async Task VerifyDevicesAsync()
        {
            var deviceCount = await _context.Esp32Devices.CountAsync();
            _logger.LogInformation($"ESP32 Devices in PGSQL: {deviceCount}");

            if (deviceCount == 0)
            {
                _logger.LogWarning("Not devices found.");
            }
        }
    }

}

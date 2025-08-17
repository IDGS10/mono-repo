using AnalyticsPSQL_MasterApi.Data;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsPSQL_MasterApi.Services
{
    public class MonitoringService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<MonitoringService> _logger;

        public MonitoringService(ApplicationDbContext context, ILogger<MonitoringService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task CheckSystemHealthAsync()
        {
            // Check offline devices
            var offlineDevices = await _context.Esp32Devices
                .Where(d => !d.IsOnline && d.Status == "active")
                .CountAsync();

            if (offlineDevices > 0)
            {
                _logger.LogWarning($"{offlineDevices} devices offline");
            }

            // Check recent readings
            var recentReadings = await _context.SensorReadings
                .Where(sr => sr.Timestamp >= DateTime.UtcNow.AddMinutes(-30))
                .CountAsync();

            if (recentReadings == 0)
            {
                _logger.LogWarning("No new records in the last 30 min");
            }

            // Check storage use
            var totalReadings = await _context.SensorReadings.CountAsync();
            if (totalReadings > 10000000) // 10 millions
            {
                _logger.LogWarning($"High data volume: {totalReadings} readings. Consider cleanup.");
            }
        }
    }
}

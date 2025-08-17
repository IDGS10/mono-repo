namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class SwarmMetricsDto
    {
        public Guid? SwarmId { get; set; }
        public string? SwarmName { get; set; }
        public int? TotalDevices { get; set; }
        public int? OnlineDevices { get; set; }
        public int? OfflineDevices { get; set; }
        public decimal? AvgBatteryLevel { get; set; }
        public int? TotalSensorReadings24h { get; set; }
        public int? ActiveAlerts { get; set; }
        public DateTime? LastActivity { get; set; }
        public string? Status { get; set; }

    }
}

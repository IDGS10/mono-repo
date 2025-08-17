namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class DeviceHealthDto
    {
        public Guid? DeviceId { get; set; }
        public decimal? HealthScore { get; set; }
        public bool? IsOnline { get; set; }
        public DateTime? LastSeen { get; set; }
        public decimal? BatteryLevel { get; set; }
        public int? StatusReportsLast24h { get; set; }
        public int? SensorReadingsLast24h { get; set; }
        public int? ActiveAlerts { get; set; }
        public decimal? AvgCpuUsage { get; set; }
        public decimal? MaxCpuUsage { get; set; }
        public double? AvgMemoryUsageMb { get; set; }
        public decimal? MaxMemoryUsageMb { get; set; }
        public decimal? AvgTemperature { get; set; }
        public decimal? MaxTemperature { get; set; }
        public int? AvgWifiRssi { get; set; }
        public int? TotalErrors { get; set; }
        public int? TotalWarnings { get; set; } 
    }
}

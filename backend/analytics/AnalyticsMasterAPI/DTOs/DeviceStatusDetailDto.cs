namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class DeviceStatusDetailDto
    {
        public decimal? CpuUsage { get; set; }
        public int? MemoryTotalKb { get; set; }
        public int? MemoryUsedKb { get; set; }
        public long? UptimeSeconds { get; set; }
        public decimal? TemperatureInternal { get; set; }
        public int? WifiRssi { get; set; }
        public int? ErrorCount { get; set; }
        public int? WarningCount { get; set; }
        public DateTime? Timestamp { get; set; }
    }
}

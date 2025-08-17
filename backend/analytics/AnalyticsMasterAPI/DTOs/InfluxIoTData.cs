namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class InfluxIoTData
    {
        public DateTime Time { get; set; }
        public string Topic { get; set; } = string.Empty;
        public string Source { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public double? Temperature { get; set; }
        public double? Humidity { get; set; }
        public double? Actuator { get; set; }
        public string? DeviceVersion { get; set; }
        public DateTime? DeviceTimestamp { get; set; }
    }
}

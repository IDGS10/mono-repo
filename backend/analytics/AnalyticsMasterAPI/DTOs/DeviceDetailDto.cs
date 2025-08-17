namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class DeviceDetailDto
    {
        public Guid? DeviceId {  get; set; }
        public string? DeviceName { get; set; }
        public string? MacAddress { get; set; }
        public string? DeviceType { get; set; }
        public string? Location { get; set; }
        public bool? IsOnline { get; set; }
        public string? Status { get; set; }
        public decimal? BatteryLevel { get; set; }
        public DateTime? LastSeen { get; set; }
        public string? FirmwareVersion { get; set; }
        public string? LastIpAddress { get; set; }
        public DateTime? InstallationDate { get; set; }
        public string? SwarmName { get; set; }
        public Guid? SwarmId { get; set; }
        public int? SensorCount { get; set; }
        public int? RecentReadingsCount { get; set; }
        public DeviceStatusDetailDto? LatestStatus { get; set; }
    }
}

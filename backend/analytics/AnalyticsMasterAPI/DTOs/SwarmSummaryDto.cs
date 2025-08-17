namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class SwarmSummaryDto
    {
        public Guid? SwarmId { get; set; }
        public string? SwarmName { get; set; }
        public string? Description { get; set; }
        public int? MaxDevices { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? Location { get; set; }
        public int? DeviceCount { get; set; }
        public int? OnlineDeviceCount { get; set; }
    }
}

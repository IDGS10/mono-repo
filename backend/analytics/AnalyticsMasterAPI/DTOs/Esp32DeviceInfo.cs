namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class Esp32DeviceInfo
    {
        public Guid DeviceId { get; set; }
        public string DeviceName { get; set; } = string.Empty;
        public string DeviceType { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
    }
}

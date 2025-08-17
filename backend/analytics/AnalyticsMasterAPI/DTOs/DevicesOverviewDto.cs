namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class DevicesOverviewDto
    {
        public int TotalDevices { get; set; }
        public int OnlineDevices { get; set; }
        public int OfflineDevices { get; set; }
        public int ActiveSwarms { get; set; }
        public Dictionary<string,int>? DevicesByStatus { get; set; }
    }
}

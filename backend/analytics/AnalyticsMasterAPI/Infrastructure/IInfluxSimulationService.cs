using AnalyticsPSQL_MasterApi.DTOs;

namespace AnalyticsPSQL_MasterApi.Infrastructure
{
    public interface IInfluxSimulationService
    {
        Task<List<InfluxIoTData>> ReadIoTDataFromInfluxAsync(DateTime from, DateTime to);
        Task SimulateMetricsForDevicesAsync(DateTime from, DateTime to);
        Task<List<Esp32DeviceInfo>> GetActiveDevicesAsync();
    }
}

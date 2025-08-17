namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class HistoricalSimulationRequest
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? IntervalHours { get; set; }
    }
}

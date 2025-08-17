namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class SensorMetricsDto
    {
        public string? SensorTypeName { get; set; }
        public string? Unit { get; set; }
        public int? Count { get; set; }
        public decimal? AvgValue { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public decimal? AvgQuality { get; set; }
        public DateTime? FirstReading { get; set; }
        public DateTime? LastReading { get; set; }
    } 
}

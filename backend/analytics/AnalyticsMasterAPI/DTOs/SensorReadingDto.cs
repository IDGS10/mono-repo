namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class SensorReadingDto
    {
        public Guid? ReadingId { get; set; }
        public string? SensorTypeName { get; set; }
        public string? Unit { get; set; }
        public decimal? RawValue { get; set; }
        public decimal? CalibratedValue { get; set; }
        public DateTime? Timestamp { get; set; }
        public decimal? QualityScore { get; set; }
    }
}

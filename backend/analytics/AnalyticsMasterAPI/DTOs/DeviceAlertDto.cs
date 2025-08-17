namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class DeviceAlertDto
    {
        public Guid? AlertId {  get; set; }
        public string? AlertType { get; set; }
        public string? Severity { get; set; }
        public string? Title {  get; set; }
        public string? Description { get; set; }
        public decimal? ThresholdValue { get; set; }
        public decimal? ActualValue { get; set; }
        public bool? IsResolved { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}

namespace AnalyticsPSQL_MasterApi.DTOs
{
    public class NetworkLogDto
    {
        public Guid? LogId { get; set; }
        public string? IpAddress { get; set; }
        public string? ConnectionType { get; set; }
        public int? SignalStrength { get; set; }
        public string? NetworkName { get; set; }
        public DateTime? ConnectedAt { get; set; }
        public DateTime? DisconnectedAt { get; set; }
        public int? DurationSeconds { get; set; }
        public decimal? DataUploadedKb { get; set; }
        public decimal? DataDownloadedKb { get; set; }
    }
}

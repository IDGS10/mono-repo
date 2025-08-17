using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("network_logs")]
    public class NetworkLog
    {
        [Key]
        [Column("log_id")]
        public Guid LogId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("ip_address")]
        [Required]
        public string IpAddress { get; set; }

        [Column("connection_type")]
        [MaxLength(20)]
        public string ConnectionType { get; set; } = "WiFi";

        [Column("signal_strength")]
        public int? SignalStrength { get; set; }

        [Column("network_name")]
        [MaxLength(100)]
        public string NetworkName { get; set; }

        [Column("connected_at")]
        public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;

        [Column("disconnected_at")]
        public DateTime? DisconnectedAt { get; set; }

        [Column("duration_seconds")]
        public int? DurationSeconds { get; set; }

        [Column("data_uploaded_kb", TypeName = "decimal(10,2)")]
        public decimal? DataUploadedKb { get; set; }

        [Column("data_downloaded_kb", TypeName = "decimal(10,4)")]
        public decimal? DataDownloadedKb { get; set; }

        // Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }
    }
}

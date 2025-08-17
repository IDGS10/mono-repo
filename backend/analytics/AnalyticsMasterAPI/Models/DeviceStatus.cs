using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("device_status")]
    public class DeviceStatus
    {
        [Key]
        [Column("status_id")]
        public Guid StatusId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("cpu_usage",TypeName = "decimal(5,2)")]
        public decimal? CpuUsage { get; set; }

        [Column("memory_used_kb")]
        public int? MemoryUsedKb { get; set; }

        [Column("memory_total_kb")]
        public int? MemoryTotalKb { get; set; }

        [Column("uptime_seconds")]
        public long? UptimeSeconds { get; set; }

        [Column("temperature_internal",TypeName = "decimal(5,2)")]
        public decimal? TemperatureInternal { get; set; }

        [Column("wifi_rssi")]
        public int? WifiRssi { get; set; }

        [Column("error_count")]
        public int? ErrorCount { get; set; } = 0;

        [Column("warning_count")]
        public int? WarningCount { get; set; } = 0;

        [Column("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }
    }
}

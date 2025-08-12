using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("device_metrics_daily")]
    public class DeviceMetricDaily
    {
        [Key]
        [Column("metric_id")]
        public Guid MetricId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("date")]
        [Required]
        public DateTime Date { get; set; }

        // Resúmenes diarios
        [Column("avg_uptime_percentage",TypeName = "decimal(5,2)" )]
        public decimal? AvgUptimePercentage { get; set; }

        [Column("total_connection_drops")]
        public int TotalConnectionDrops { get; set; } = 0;

        [Column("total_data_transmitted_kb",TypeName = "decimal(10,2)" )]
        public decimal TotalDataTransmittedKb { get; set; } = 0;

        [Column("avg_signal_strength")]
        public int? AvgSignalStrength { get; set; }

        [Column("avg_cpu_usage", TypeName = "decimal(5,2)")]
        public decimal? AvgCpuUsage { get; set; }

        [Column("avg_memory_usage", TypeName = "decimal(5,2)")]
        public decimal? AvgMemoryUsage { get; set; }

        [Column("total_errors")]
        public int TotalErrors { get; set; } = 0;

        [Column("total_warnings")]
        public int TotalWarnings { get; set; } = 0;

        [Column("total_readings")]
        public int TotalReadings { get; set; } = 0;

        [Column("avg_data_quality", TypeName = "decimal(3,2)")]
        public decimal AvgDataQuality { get; set; }

        [Column("min_battery_level", TypeName = "decimal(5,2)")]
        public decimal? MinBatteryLevel { get; set; }

        [Column("avg_battery_level",TypeName = "decimal(5,2)")]
        public decimal? AvgBatteryLevel { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navegación
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }
    }
}

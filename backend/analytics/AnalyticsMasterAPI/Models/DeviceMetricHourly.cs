using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("device_metrics_hourly")]
    public class DeviceMetricHourly
    {
        [Key]
        [Column("metric_id")]
        public Guid MetricId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("hour_timestamp")]
        [Required]
        public DateTime HourTimestamp { get; set; }

        // Connectivity Metrics
        [Column("uptime_percentage", TypeName = "decimal(5,2)")]
        public decimal? UptimePercentage { get; set; }

        [Column("avg_signal_strength")]
        public int? AvgSignalStrength { get; set; }

        [Column("connection_drops")]
        public int? ConnectionDrops { get; set; } = 0;

        [Column("data_transmitted_kb", TypeName = "decimal(5,2)")]
        public decimal? DataTransmittedKb { get; set; } = 0;

        [Column("data_received_kb",TypeName = "decimal(10,2)")]
        public decimal? DataReceivedKb { get; set; } = 0;

        // Métricas de rendimiento
        [Column("avg_cpu_usage",TypeName = "decimal(5,2)")]
        public decimal? AvgCpuUsage { get; set; }

        [Column("max_cpu_usage",TypeName = "decimal(5,2)")]
        public decimal? MaxCpuUsage { get; set; }

        [Column("avg_memory_usage",TypeName = "decimal(5,2)")]
        public decimal? AvgMemoryUsage { get; set; }

        [Column("max_memory_usage",TypeName = "decimal(5,2)")]
        public decimal? MaxMemoryUsage { get; set; }

        [Column("avg_internal_temperature",TypeName = "decimal(5,2)")]
        public decimal? AvgInternalTemperature { get; set; }

        [Column("max_internal_temperature", TypeName = "decimal(5,2)")]
        public decimal? MaxInternalTemperature { get; set; }

        // Health metrics
        [Column("error_count")]
        public int? ErrorCount { get; set; } = 0;

        [Column("warning_count")]
        public int? WarningCount { get; set; } = 0;

        [Column("reading_count")]
        public int? ReadingCount { get; set; } = 0;

        [Column("failed_reading_count")]
        public int? FailedReadingCount { get; set; } = 0;

        [Column("avg_battery_level", TypeName = "decimal(5,2)")]
        public decimal? AvgBatteryLevel { get; set; }

        [Column("min_battery_level", TypeName = "decimal(5,2)")]
        public decimal? MinBatteryLevel { get; set; }

        // Quality Metrics
        [Column("avg_data_quality", TypeName = "decimal(3,2)")]
        public decimal? AvgDataQuality { get; set; }

        [Column("out_of_range_readings")]
        public int? OutOfRangeReadings { get; set; } = 0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }
    }
}

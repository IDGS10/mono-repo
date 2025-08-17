using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("alert_metrics_hourly")]
    public class AlertMetricHourly
    {
        [Key]
        [Column("metric_id")]
        public Guid MetricId { get; set; } = Guid.NewGuid();

        [Column("hour_timestamp")]
        [Required]
        public DateTime HourTimestamp { get; set; }

        [Column("swarm_id")]
        public Guid SwarmId { get; set; }

        // Count alerts by type
        [Column("threshold_alerts")]
        public int ThresholdAlerts { get; set; } = 0;

        [Column("offline_alerts")]
        public int OfflineAlerts { get; set; } = 0;

        [Column("battery_alerts")]
        public int BatteryAlerts { get; set; } = 0;

        [Column("error_alerts")]
        public int ErrorAlerts { get; set; } = 0;

        [Column("connection_alerts")]
        public int ConnectionAlerts { get; set; } = 0;

        // Count alerts by severity
        [Column("low_severity_alerts")]
        public int LowSeverityAlerts { get; set; } = 0;

        [Column("medium_severity_alerts")]
        public int MediumSeverityAlerts { get; set; } = 0;

        [Column("high_severity_alerts")]
        public int HighSeverityAlerts { get; set; } = 0;

        [Column("critical_severity_alerts")]
        public int CriticalSeverityAlerts { get; set; } = 0;

        // Metrics resolution
        [Column("alerts_resolved")]
        public int AlertsResolved { get; set; } = 0;

        [Column("avg_resolution_time_minutes",TypeName = "decimal(8,2)")]
        public decimal? AvgResolutionTimeMinutes { get; set; }

        [Column("escalated_alerts")]
        public int EscalatedAlerts { get; set; } = 0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("SwarmId")]
        public virtual DeviceSwarm Swarm { get; set; }
    }
}

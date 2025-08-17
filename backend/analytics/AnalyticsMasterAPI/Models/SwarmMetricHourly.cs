using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("swarm_metrics_hourly")]
    public class SwarmMetricHourly
    {
        [Key]
        [Column("metric_id")]
        public Guid MetricId { get; set; } = Guid.NewGuid();

        [Column("swarm_id")]
        public Guid SwarmId { get; set; }

        [Column("hour_timestamp")]
        [Required]
        public DateTime HourTimestamp { get; set; }

        // Devices Health
        [Column("total_devices")]
        public int TotalDevices { get; set; } = 0;

        [Column("online_devices")]
        public int OnlineDevices { get; set; } = 0;

        [Column("offline_devices")]
        public int OfflineDevices { get; set; } = 0;

        [Column("avg_uptime_percentage", TypeName = "decimal(5,2)")]
        public decimal? AvgUptimePercentage { get; set; }

        [Column("devices_with_alerts")]
        public int DevicesWithAlerts { get; set; } = 0;

        [Column("devices_with_critical_alerts")]
        public int DevicesWithCriticalAlerts { get; set; } = 0;

        // Battery stats
        [Column("avg_battery_level", TypeName = "decimal(5,2)")]
        public decimal? AvgBatteryLevel { get; set; }

        [Column("min_battery_level", TypeName = "decimal(5,2)")]
        public decimal? MinBatteryLevel { get; set; }

        [Column("low_battery_devices")]
        public int LowBatteryDevices { get; set; } = 0;

        // Network stats
        [Column("avg_signal_strength")]
        public int? AvgSignalStrength { get; set; }

        [Column("total_connection_drops")]
        public int TotalConnectionDrops { get; set; } = 0;

        [Column("total_data_transmitted_kb", TypeName = "decimal(10,2)")]
        public decimal TotalDataTransmittedKb { get; set; } = 0;

        [Column("total_data_received_kb", TypeName = "decimal(10,2)")]
        public decimal TotalDataReceivedKb { get; set; } = 0;

        // Data recollection metrics
        [Column("total_readings")]
        public int TotalReadings { get; set; } = 0;

        [Column("failed_readings")]
        public int FailedReadings { get; set; } = 0;

        [Column("avg_data_quality", TypeName = "decimal(3,2)")]
        public decimal AvgDataQuality { get; set; }

        [Column("total_anomalies")]
        public int TotalAnomalies { get; set; } = 0;

        // Alerts stats
        [Column("new_alerts")]
        public int NewAlerts { get; set; } = 0;

        [Column("resolved_alerts")]
        public int ResolvedAlerts { get; set; } = 0;

        [Column("active_alerts")]
        public int ActiveAlerts { get; set; } = 0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("SwarmId")]
        public virtual DeviceSwarm Swarm { get; set; }
    }
}

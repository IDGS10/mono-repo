using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("sensor_metrics_hourly")]
    public class SensorMetricHourly
    {
        [Key]
        [Column("metric_id")]
        public Guid MetricId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("sensor_type_id")]
        public int SensorTypeId { get; set; }

        [Column("hour_timestamp")]
        [Required]
        public DateTime HourTimestamp { get; set; }

        // Basic statics
        [Column("reading_count")]
        public int ReadingCount { get; set; } = 0;

        [Column("avg_value",TypeName = "decimal(10,4)")]
        public decimal? AvgValue { get; set; }

        [Column("min_value", TypeName = "decimal(10,4)")]
        public decimal? MinValue { get; set; }

        [Column("max_value", TypeName = "decimal(10,4)")]
        public decimal? MaxValue { get; set; }

        [Column("median_value", TypeName = "decimal(10,4)")]
        public decimal? MedianValue { get; set; }

        [Column("stddev_value", TypeName = "decimal(10,4)")]
        public decimal? StddevValue { get; set; }

        [Column("variance_value", TypeName = "decimal(10,4)")]
        public decimal? VarianceValue { get; set; }

        // Data percentile
        [Column("percentile_25", TypeName = "decimal(10,4)")]
        public decimal? Percentile25 { get; set; }

        [Column("percentile_75", TypeName = "decimal(10,4)")]
        public decimal? Percentile75 { get; set; }

        [Column("percentile_95", TypeName = "decimal(10,4)")]
        public decimal? Percentile95 { get; set; }

        [Column("percentile_99", TypeName = "decimal(10,4)")]
        public decimal? Percentile99 { get; set; }

        // Trend and changes
        [Column("trend_direction")]
        [MaxLength(10)]
        public string TrendDirection { get; set; }

        [Column("rate_of_change", TypeName = "decimal(10,6)")]
        public decimal? RateOfChange { get; set; }

        [Column("volatility_score", TypeName = "decimal(5,2)")]
        public decimal? VolatilityScore { get; set; }

        // Quality Metrics
        [Column("avg_quality_score", TypeName = "decimal(3,2)")]
        public decimal? AvgQualityScore { get; set; }

        [Column("out_of_range_count")]
        public int OutOfRangeCount { get; set; } = 0;

        [Column("anomaly_count")]
        public int AnomalyCount { get; set; } = 0;

        [Column("gap_count")]
        public int GapCount { get; set; } = 0;

        // Threshold
        [Column("above_threshold_count")]
        public int AboveThresholdCount { get; set; } = 0;

        [Column("below_threshold_count")]
        public int BelowThresholdCount { get; set; } = 0;

        [Column("threshold_violation_duration_minutes")]
        public int ThresholdViolationDurationMinutes { get; set; } = 0;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        //  Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }

        [ForeignKey("SensorTypeId")]
        public virtual SensorType SensorType { get; set; }

    }
}

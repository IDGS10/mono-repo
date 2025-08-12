using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("sensor_baselines")]
    public class SensorBaseline
    {
        [Key]
        [Column("baseline_id")]
        public Guid BaselineId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("sensor_type_id")]
        public int SensorTypeId { get; set; }

        // Baselines time-based
        [Column("hour_of_day")]
        public int? HourOfDay { get; set; }

        [Column("day_of_week")]
        public int? DayOfWeek { get; set; }

        // Baselines stats
        [Column("baseline_avg",TypeName = "decimal(10,4)")]
        public decimal? BaselineAvg { get; set; }

        [Column("baseline_stddev", TypeName = "decimal(10,4)")]
        public decimal? BaselineStddev { get; set; }

        [Column("baseline_min", TypeName = "decimal(10,4)")]
        public decimal? BaselineMin { get; set; }

        [Column("baseline_max", TypeName = "decimal(10,4)")]
        public decimal? BaselineMax { get; set; }

        // Threshold detection
        [Column("upper_threshold", TypeName = "decimal(10,4)")]
        public decimal? UpperThreshold { get; set; }

        [Column("lower_threshold", TypeName = "decimal(10,4)")]
        public decimal? LowerThreshold { get; set; }

        // Metadata
        [Column("sample_count")]
        public int SampleCount { get; set; } = 0;

        [Column("last_updated")]
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        // Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }

        [ForeignKey("SensorTypeId")]
        public virtual SensorType SensorType { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("sensor_readings")]
    public class SensorReading
    {
        [Key]
        [Column("reading_id")]
        public Guid ReadingId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("sensor_type_id")]
        public int SensorTypeId { get; set; }

        [Column("raw_value", TypeName = "decimal(10,4)")]
        [Required]
        public decimal RawValue { get; set; }

        [Column("calibrated_value", TypeName = "decimal(10,4)")]
        public decimal? CalibratedValue { get; set; }

        [Column("timestamp")]
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [Column("quality_score", TypeName = "decimal(3,2)")]
        public decimal? QualityScore { get; set; } = 1.0m;

        [Column("metadata", TypeName = "jsonb")]
        public string Metadata { get; set; }

        // Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }

        [ForeignKey("SensorTypeId")]
        public virtual SensorType SensorType { get; set; }
    }
}

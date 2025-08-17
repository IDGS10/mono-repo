using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("sensor_types")]
    public class SensorType
    {
        [Key]
        [Column("sensor_type_id")]
        public int SensorTypeId { get; set; }

        [Column("sensor_name")]
        [Required]
        [MaxLength(50)]
        public string SensorName { get; set; }

        [Column("unit")]
        [MaxLength(20)]
        public string Unit { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("min_value", TypeName = "decimal(10,4)")]
        public decimal? MinValue { get; set; }

        [Column("max_value",TypeName = "decimal(10,4)")]
        public decimal? MaxValue { get; set; }

        [Column("precision_digits")]
        public int PrecisionDigits { get; set; } = 2;

        // Navigation
        public virtual ICollection<DeviceSensor> DeviceSensors { get; set; } = new List<DeviceSensor>();
        public virtual ICollection<SensorReading> SensorReadings { get; set; } = new List<SensorReading>();
    }
}

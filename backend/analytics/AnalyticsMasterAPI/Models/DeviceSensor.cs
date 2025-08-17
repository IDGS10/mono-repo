using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("device_sensors")]
    public class DeviceSensor
    {
        [Key]
        [Column("device_sensor_id")]
        public Guid DeviceSensorId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("sensor_type_id")]
        public int SensorTypeId { get; set; }

        [Column("sensor_pin")]
        public int? SensorPin { get; set; }

        [Column("calibration_offset", TypeName = "decimal(10,4)")]
        public decimal CalibrationOffset { get; set; } = 0;

        [Column("calibration_multiplier", TypeName = "decimal(10,4)")]
        public decimal CalibrationMultiplier { get; set; } = 1;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }

        [ForeignKey("SensorTypeId")]
        public virtual SensorType SensorType { get; set; }
    }
}

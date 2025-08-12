using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("esp32_devices")]
    public class Esp32Device
    {
        [Key]
        [Column("device_id")]
        public Guid DeviceId { get; set; } = Guid.NewGuid();

        [Column("swarm_id")]
        public Guid SwarmId { get; set; }

        [Column("device_name")]
        [Required]
        [MaxLength(100)]
        public string DeviceName { get; set; }

        [Column("mac_address")]
        [MaxLength(17)]
        public string MacAddress { get; set; }

        [Column("firmware_version")]
        [MaxLength(50)]
        public string FirmwareVersion { get; set; }

        [Column("last_ip_address")]
        public string LastIpAddress { get; set; }

        [Column("device_type")]
        [MaxLength(50)]
        public string DeviceType { get; set; } = "ESP32";

        [Column("location")]
        [MaxLength(200)]
        public string Location { get; set; }

        [Column("installation_date")]
        public DateTime InstallationDate { get; set; } = DateTime.UtcNow;

        [Column("last_seen")]
        public DateTime LastSeen { get; set; } = DateTime.UtcNow;

        [Column("is_online")]
        public bool IsOnline { get; set; } = false;

        [Column("battery_level",TypeName = "decimal(5,2)")]
        public decimal? BatteryLevel { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        [ForeignKey("SwarmId")]
        public virtual DeviceSwarm Swarm { get; set; }
        public virtual ICollection<DeviceSensor> DeviceSensors { get; set; } = new List<DeviceSensor>();
        public virtual ICollection<SensorReading> SensorReadings { get; set; } = new List<SensorReading>();
        public virtual ICollection<NetworkLog> NetworkLogs { get; set; } = new List<NetworkLog>();
        public virtual ICollection<DeviceStatus> DeviceStatuses { get; set; } = new List<DeviceStatus>();
        public virtual ICollection<DeviceAlert> DeviceAlerts { get; set; } = new List<DeviceAlert>();
    }
}

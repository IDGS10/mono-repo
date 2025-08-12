using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("device_swarms")]
    public class DeviceSwarm
    {
        [Key]
        [Column("swarm_id")]
        public Guid SwarmId { get; set; } = Guid.NewGuid();

        [Column("swarm_name")]
        [Required]
        [MaxLength(100)]
        public string SwarmName { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("location")]
        [MaxLength(200)]
        public string Location { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        // Navigation
        public virtual ICollection<Esp32Device> Devices { get; set; } = new List<Esp32Device>();
        public virtual ICollection<SwarmMetricHourly> SwarmMetrics { get; set; } = new List<SwarmMetricHourly>();

    }
}

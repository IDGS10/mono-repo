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

        [Column("max_devices")]
        public int MaxDevices { get; set; }

        [Column("requester_id")]
        [Required]
        public int RequestorId { get; set; }

        [Column("project_id")]
        public int ProjectId { get; set; }

        [Column("cluster_manager_id")]
        public int ClusterManagerId { get; set; }

        [Column("status")]
        public string Status { get; set; }

        [Column("location")]
        [MaxLength(200)]
        public string Location { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [Column("assigned_at")]
        public DateTime AssignatedAt { get; set; } = DateTime.UtcNow;
        
        [Column("activated_at")]
        public DateTime ActivatedAt { get; set; } = DateTime.UtcNow;

        [Column("completed_at")]
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        // Navigation
        public virtual ICollection<Esp32Device> Devices { get; set; } = new List<Esp32Device>();
        public virtual ICollection<SwarmMetricHourly> SwarmMetrics { get; set; } = new List<SwarmMetricHourly>();

    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("device_alerts")]
    public class DeviceAlert
    {
        [Key]
        [Column("alert_id")]
        public Guid AlertId { get; set; } = Guid.NewGuid();

        [Column("device_id")]
        public Guid DeviceId { get; set; }

        [Column("alert_type")]
        [Required]
        [MaxLength(50)]
        public string AlertType { get; set; }

        [Column("severity")]
        [MaxLength(20)]
        public string Severity { get; set; } = "medium";

        [Column("title")]
        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Column("description")]
        public string Description { get; set; }

        [Column("threshold_value",TypeName = "decimal(10,4)")]
        public decimal? ThresholdValue { get; set; }

        [Column("actual_value",TypeName = "decimal(10,4)")]
        public decimal? ActualValue { get; set; }

        [Column("is_resolved")]
        public bool IsResolved { get; set; } = false;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("resolved_at")]
        public DateTime? ResolvedAt { get; set; }

        [Column("metadata",TypeName = "jsonb")]
        public string Metadata { get; set; }

        // Navigation
        [ForeignKey("DeviceId")]
        public virtual Esp32Device Device { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AnalyticsPSQL_MasterApi.Models
{
    [Table("api_performance_metrics")]
    public class ApiPerformanceMetric
    {
        [Key]
        [Column("metric_id")]
        public Guid MetricId { get; set; } = Guid.NewGuid();

        [Column("hour_timestamp")]
        [Required]
        public DateTime HourTimestamp { get; set; }

        // Processing metrics
        [Column("readings_processed")]
        public int ReadingsProcessed { get; set; } = 0;

        [Column("processing_time_ms")]
        public int ProcessingTimeMs { get; set; } = 0;

        [Column("avg_processing_time_per_reading", TypeName = "decimal(8,4)")]
        public decimal? AvgProcessingTimePerReading { get; set; }

        // Queue metrics
        [Column("max_queue_size")]
        public int MaxQueueSize { get; set; } = 0;

        [Column("avg_queue_size", TypeName = "decimal(8,2)")]
        public decimal? AvgQueueSize { get; set; }

        [Column("queue_overflow_count")]
        public int QueueOverflowCount { get; set; } = 0;

        // Error metrics
        [Column("processing_errors")]
        public int ProcessingErrors { get; set; } = 0;

        [Column("timeout_errors")]
        public int TimeoutErrors { get; set; } = 0;

        [Column("connection_errors")]
        public int ConnectionErrors { get; set; } = 0;

        // Database metrics
        [Column("db_query_count")]
        public int DbQueryCount { get; set; } = 0;

        [Column("avg_db_query_time_ms", TypeName = "decimal(8,2)")]
        public decimal? AvgDbQueryTimeMs { get; set; }

        [Column("db_connection_errors")]
        public int DbConnectionErrors { get; set; } = 0;

        // Memmory and CPU (only if is API monitoring)
        [Column("avg_memory_usage_mb",TypeName = "decimal(8,2)")]
        public decimal? AvgMemoryUsageMb { get; set; }

        [Column("max_memory_usage_mb",TypeName = "decimal(8,2)")]
        public decimal? MaxMemoryUsageMb { get; set; }

        [Column("avg_cpu_usage",TypeName = "decimal(5,2)")]
        public decimal? AvgCpuUsage { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

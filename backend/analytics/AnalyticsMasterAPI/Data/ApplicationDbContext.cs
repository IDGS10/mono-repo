using Microsoft.EntityFrameworkCore;
using AnalyticsPSQL_MasterApi.Models;

namespace AnalyticsPSQL_MasterApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        // Main Tables
        public DbSet<DeviceSwarm> DeviceSwarms { get; set; }
        public DbSet<Esp32Device> Esp32Devices { get; set; }
        public DbSet<SensorType> SensorTypes { get; set; }
        public DbSet<DeviceSensor> DeviceSensors { get; set; }
        public DbSet<SensorReading> SensorReadings { get; set; }
        public DbSet<NetworkLog> NetworkLogs { get; set; }
        public DbSet<DeviceStatus> DeviceStatus { get; set; }
        public DbSet<DeviceAlert> DeviceAlerts { get; set; }

        // Metrics Tables
        public DbSet<DeviceMetricHourly> DeviceMetricsHourly { get; set; }
        public DbSet<SensorMetricHourly> SensorMetricsHourly { get; set; }
        public DbSet<SwarmMetricHourly> SwarmMetricsHourly { get; set; }
        public DbSet<DeviceMetricDaily> DeviceMetricsDaily { get; set; }
        public DbSet<AlertMetricHourly> AlertMetricsHourly { get; set; }
        public DbSet<SensorBaseline> SensorBaselines { get; set; }
        public DbSet<ApiPerformanceMetric> ApiPerformanceMetrics { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Additional configurations
            modelBuilder.Entity<DeviceSensor>()
                .HasIndex(ds => new { ds.DeviceId, ds.SensorTypeId, ds.SensorPin })
                .IsUnique();

            modelBuilder.Entity<DeviceMetricHourly>()
                .HasIndex(dm => new { dm.DeviceId, dm.HourTimestamp })
                .IsUnique();

            modelBuilder.Entity<SensorMetricHourly>()
                .HasIndex(sm => new { sm.DeviceId, sm.SensorTypeId, sm.HourTimestamp })
                .IsUnique();

            modelBuilder.Entity<SwarmMetricHourly>()
                .HasIndex(sm => new { sm.SwarmId, sm.HourTimestamp })
                .IsUnique();

            modelBuilder.Entity<DeviceMetricDaily>()
                .HasIndex(dm => new { dm.DeviceId, dm.Date })
                .IsUnique();

            modelBuilder.Entity<AlertMetricHourly>()
                .HasIndex(am => new { am.HourTimestamp, am.SwarmId })
                .IsUnique();

            modelBuilder.Entity<SensorBaseline>()
                .HasIndex(sb => new { sb.DeviceId, sb.SensorTypeId, sb.HourOfDay, sb.DayOfWeek })
                .IsUnique();

            modelBuilder.Entity<ApiPerformanceMetric>()
                .HasIndex(pm => pm.HourTimestamp)
                .IsUnique();

            // Foreign keys and relationships
            modelBuilder.Entity<Esp32Device>()
                .HasOne(d => d.Swarm)
                .WithMany(s => s.Devices)
                .HasForeignKey(d => d.SwarmId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DeviceSensor>()
                .HasOne(ds => ds.Device)
                .WithMany(d => d.DeviceSensors)
                .HasForeignKey(ds => ds.DeviceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DeviceSensor>()
                .HasOne(ds => ds.SensorType)
                .WithMany(st => st.DeviceSensors)
                .HasForeignKey(ds => ds.SensorTypeId);

            // Partition tables will be schedule by DB Tasks [AA. Notes]
        }

    }
}

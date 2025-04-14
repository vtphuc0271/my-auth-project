using Auth.Core.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Auth.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<OtpRecord> OtpRecords { get; set; }
        public DbSet<ObjectPermission> ObjectPermissions { get; set; }
        public DbSet<QrCodeSession> QrCodeSessions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình khóa chính cho các bảng composite key
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserID, ur.RoleID });

            modelBuilder.Entity<RolePermission>()
                .HasKey(rp => new { rp.RoleID, rp.PermissionID });

            // Cấu hình unique index
            modelBuilder.Entity<QrCodeSession>()
                .HasIndex(q => q.Code)
                .IsUnique();

            modelBuilder.Entity<OtpRecord>()
                .HasIndex(o => o.OtpCode)
                .IsUnique();
        }
    }
}
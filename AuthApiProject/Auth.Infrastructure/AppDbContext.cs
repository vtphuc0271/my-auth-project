using Microsoft.EntityFrameworkCore;
using Auth.Core.Models;

namespace Auth.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<OtpRecord> OtpRecords { get; set; }
    }
}
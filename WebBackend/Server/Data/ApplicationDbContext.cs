using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Models;

namespace StoryOfTime.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = default!;
        public DbSet<News> News { get; set; } = default!;
        public DbSet<ShopCategory> ShopCategories { get; set; } = default!;
        public DbSet<ShopOrder> ShopOrders { get; set; } = default!;
        public DbSet<UserPointLog> UserPointLogs { get; set; } = default!;
        public DbSet<GameServerSetting> GameServerSettings { get; set; } = default!;
        public DbSet<ShopItem> ShopItems { get; set; } = default!;
        public DbSet<Comment> Comments { get; set; } = default!;
        public DbSet<ServerStatusLog> ServerStatusLogs { get; set; } = default!;
        public DbSet<PaymentTransaction> PaymentTransactions { get; set; } = default!;
    }
}
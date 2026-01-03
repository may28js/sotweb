using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Models;

namespace StoryOfTime.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<News> News { get; set; }
        public DbSet<ShopCategory> ShopCategories { get; set; }
        public DbSet<ShopOrder> ShopOrders { get; set; }
        public DbSet<UserPointLog> UserPointLogs { get; set; }
        public DbSet<GameServerSetting> GameServerSettings { get; set; }
        public DbSet<ShopItem> ShopItems { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<ServerStatusLog> ServerStatusLogs { get; set; }
    }
}
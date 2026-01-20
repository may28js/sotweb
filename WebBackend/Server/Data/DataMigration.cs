using Microsoft.EntityFrameworkCore;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;

namespace StoryOfTime.Server.Data
{
    public class DataMigration
    {
        public static void MigrateSqliteToMySql(string sqliteConnectionString, ApplicationDbContext mysqlContext)
        {
            // Configure SQLite Context manually
            var sqliteOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(sqliteConnectionString)
                .Options;

            using var sqliteContext = new ApplicationDbContext(sqliteOptions);

            // Ensure SQLite DB exists
            if (!sqliteContext.Database.CanConnect())
            {
                Console.WriteLine("[MIGRATION] SQLite database not found. Skipping migration.");
                return;
            }

            Console.WriteLine("[MIGRATION] Starting data migration from SQLite to MySQL...");

            // Migrate Users
            if (!mysqlContext.Users.Any())
            {
                var users = sqliteContext.Users.AsNoTracking().ToList();
                if (users.Any())
                {
                    // Clear IDs to let MySQL auto-increment handle it, or keep them if Identity Insert is allowed
                    // For simplicity, we keep IDs to maintain relationships, assuming MySQL tables are empty and auto-increment matches
                    // However, EF Core with MySQL might complain about inserting explicit values into identity columns
                    // unless we handle it carefully. 
                    // Strategy: Reset ID to 0 for auto-increment OR use raw SQL for identity insert.
                    // Given we want to preserve relationships (User <-> Orders), we MUST preserve IDs.
                    
                    // EF Core allows inserting identity values if they are provided.
                    
                    mysqlContext.Users.AddRange(users);
                    Console.WriteLine($"[MIGRATION] Migrated {users.Count} Users.");
                }
            }

            // Migrate News
            if (!mysqlContext.News.Any())
            {
                var news = sqliteContext.News.AsNoTracking().ToList();
                if (news.Any())
                {
                    mysqlContext.News.AddRange(news);
                    Console.WriteLine($"[MIGRATION] Migrated {news.Count} News items.");
                }
            }

            // Migrate ShopCategories
            if (!mysqlContext.ShopCategories.Any())
            {
                var categories = sqliteContext.ShopCategories.AsNoTracking().ToList();
                if (categories.Any())
                {
                    mysqlContext.ShopCategories.AddRange(categories);
                    Console.WriteLine($"[MIGRATION] Migrated {categories.Count} ShopCategories.");
                }
            }

            // Migrate ShopItems
            if (!mysqlContext.ShopItems.Any())
            {
                var items = sqliteContext.ShopItems.AsNoTracking().ToList();
                if (items.Any())
                {
                    mysqlContext.ShopItems.AddRange(items);
                    Console.WriteLine($"[MIGRATION] Migrated {items.Count} ShopItems.");
                }
            }

            // Migrate ShopOrders
            if (!mysqlContext.ShopOrders.Any())
            {
                var orders = sqliteContext.ShopOrders.AsNoTracking().ToList();
                if (orders.Any())
                {
                    mysqlContext.ShopOrders.AddRange(orders);
                    Console.WriteLine($"[MIGRATION] Migrated {orders.Count} ShopOrders.");
                }
            }

            // Migrate UserPointLogs
            if (!mysqlContext.UserPointLogs.Any())
            {
                var logs = sqliteContext.UserPointLogs.AsNoTracking().ToList();
                if (logs.Any())
                {
                    mysqlContext.UserPointLogs.AddRange(logs);
                    Console.WriteLine($"[MIGRATION] Migrated {logs.Count} UserPointLogs.");
                }
            }

            // Migrate Comments
            if (!mysqlContext.Comments.Any())
            {
                var comments = sqliteContext.Comments.AsNoTracking().ToList();
                if (comments.Any())
                {
                    mysqlContext.Comments.AddRange(comments);
                    Console.WriteLine($"[MIGRATION] Migrated {comments.Count} Comments.");
                }
            }
            
            // Migrate PaymentTransactions
            if (!mysqlContext.PaymentTransactions.Any())
            {
                var txs = sqliteContext.PaymentTransactions.AsNoTracking().ToList();
                if (txs.Any())
                {
                    mysqlContext.PaymentTransactions.AddRange(txs);
                    Console.WriteLine($"[MIGRATION] Migrated {txs.Count} PaymentTransactions.");
                }
            }

            try
            {
                // Enable identity insert logic is handled by EF Core when ID is set
                mysqlContext.Database.OpenConnection();
                try
                {
                    mysqlContext.Database.ExecuteSqlRaw("SET FOREIGN_KEY_CHECKS = 0;");
                    mysqlContext.SaveChanges();
                    mysqlContext.Database.ExecuteSqlRaw("SET FOREIGN_KEY_CHECKS = 1;");
                    Console.WriteLine("[MIGRATION] Data migration completed successfully!");
                }
                finally
                {
                    mysqlContext.Database.CloseConnection();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MIGRATION] Error saving migrated data: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[MIGRATION] Inner Error: {ex.InnerException.Message}");
                }
            }
        }
    }
}

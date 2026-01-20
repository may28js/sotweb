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

        // Community
        public DbSet<Channel> Channels { get; set; } = default!;
        public DbSet<Post> Posts { get; set; } = default!;
        public DbSet<Message> Messages { get; set; } = default!;
        public DbSet<MessageReaction> MessageReactions { get; set; } = default!;
        public DbSet<PostReaction> PostReactions { get; set; } = default!;
        public DbSet<CommunityRole> CommunityRoles { get; set; } = default!;
        public DbSet<ChannelPermissionOverride> ChannelPermissionOverrides { get; set; } = default!;
        public DbSet<UserCommunityRole> UserCommunityRoles { get; set; } = default!; // Added
        public DbSet<UserChannelState> UserChannelStates { get; set; } = default!;
        public DbSet<UserPostState> UserPostStates { get; set; } = default!;
        public DbSet<CommunitySettings> CommunitySettings { get; set; } = default!;
        public DbSet<Friendship> Friendships { get; set; } = default!;
        public DbSet<DirectMessage> DirectMessages { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Requester)
                .WithMany()
                .HasForeignKey(f => f.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Addressee)
                .WithMany()
                .HasForeignKey(f => f.AddresseeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DirectMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DirectMessage>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}

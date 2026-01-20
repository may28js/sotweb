namespace StoryOfTime.Server.Models
{
    public class CommunitySettings
    {
        public int Id { get; set; }
        public string ServerName { get; set; } = "时之故事社区";
        public string? IconUrl { get; set; }
        public string? ThemeImageUrl { get; set; }
        public int? DefaultChannelId { get; set; }
        public DateTime LastGlobalNotifyAt { get; set; } = DateTime.MinValue;
    }
}

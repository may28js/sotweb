namespace StoryOfTime.Server.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Nickname { get; set; }
        public string? AboutMe { get; set; }
        public string? AvatarUrl { get; set; }
        public int PreferredStatus { get; set; }
        public string RoleColor { get; set; } = "#ffffff";
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateUserProfileDto
    {
        public string? Nickname { get; set; }
        public string? AboutMe { get; set; }
        public string? AvatarUrl { get; set; }
        public int? PreferredStatus { get; set; }
    }
}

using System;

namespace StoryOfTime.Server.DTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int NewsId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Avatar { get; set; } // Placeholder for future avatar implementation
    }

    public class CreateCommentDto
    {
        public int NewsId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}

namespace StoryOfTime.Server.DTOs
{
    public class ChannelPermissionOverrideDto
    {
        public int RoleId { get; set; }
        public long Allow { get; set; }
        public long Deny { get; set; }
    }
}

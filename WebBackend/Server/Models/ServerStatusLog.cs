using System.ComponentModel.DataAnnotations;

namespace StoryOfTime.Server.Models
{
    public class ServerStatusLog
    {
        public int Id { get; set; }

        public DateTime Timestamp { get; set; }

        public int OnlinePlayers { get; set; }

        public int CpuUsage { get; set; }

        public int MemoryUsage { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = string.Empty;
    }
}

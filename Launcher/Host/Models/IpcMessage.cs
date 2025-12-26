using System.Text.Json.Serialization;

namespace StoryOfTimeLauncher.Models
{
    public class IpcMessage
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("payload")]
        public object? Payload { get; set; }
    }
}

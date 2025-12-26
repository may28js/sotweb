using System.IO;
using System.Text.Json;

namespace StoryOfTimeLauncher.Models
{
    public class AppConfig
    {
        public string? InstallPath { get; set; }
        public string? GameVersion { get; set; }
        public bool IsFirstRun { get; set; } = true;
    }
}

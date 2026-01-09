namespace StoryOfTimeLauncher.Host.Models
{
    public enum LauncherState
    {
        Checking,       // Initializing / Checking for updates
        Install,        // No client found
        Update,         // Client found, update available
        Ready,          // Client found, up to date
        Working,        // Busy (Installing / Updating / Processing)
        Playing,        // Game launched
        Error           // Failed state
    }

    public class LauncherStatus
    {
        public LauncherState State { get; set; }
        public string Message { get; set; } = string.Empty;
        public double Progress { get; set; } = 0;
        public string Speed { get; set; } = string.Empty;
    }
}

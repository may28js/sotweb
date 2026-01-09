namespace StoryOfTimeLauncher.Host.Models
{
    public class SanitizeProgress
    {
        public int ProcessedCount { get; set; }
        public int TotalCount { get; set; }
        public string CurrentFile { get; set; } = string.Empty;
        public double Percentage => TotalCount > 0 ? (double)ProcessedCount / TotalCount * 100 : 0;
    }
}

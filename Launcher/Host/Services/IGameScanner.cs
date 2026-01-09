using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Host.Models;

namespace StoryOfTimeLauncher.Host.Services
{
    public class ScanResult
    {
        public bool IsValid { get; set; }
        public bool IsWritable { get; set; }
        public string Message { get; set; } = string.Empty;
        public string GameVersion { get; set; } = "Unknown";
    }

    public interface IGameScanner
    {
        ScanResult ScanDirectory(string path);
        Task<List<string>> AutoDiscoverClientsAsync();
        Task ImportClientAsync(string sourcePath, string targetPath, ClientManifest? manifest, IProgress<TransferProgress>? progress = null, PauseToken? pauseToken = null);
    }

    public class TransferProgress
    {
        public long TotalBytes { get; set; }
        public long ProcessedBytes { get; set; }
        public string CurrentFileName { get; set; } = string.Empty;
        public double Percentage => TotalBytes > 0 ? (double)ProcessedBytes / TotalBytes * 100 : 0;
    }
}

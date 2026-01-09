using System;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Host.Models;
using StoryOfTimeLauncher.Models;

namespace StoryOfTimeLauncher.Host.Services
{
    public class PatchProgress
    {
        public int ProcessedCount { get; set; }
        public int TotalCount { get; set; }
        public string CurrentFileName { get; set; } = string.Empty;
        public double CurrentFileProgress { get; set; } // 0-100
        public long TotalBytesDownloaded { get; set; }
    }

    public interface IPatcher
    {
        // Old Method (Deprecated but keeping for now if needed, or removing)
        // Task<bool> ApplyPatchAsync(string installPath, ClientManifest manifest, string downloadBaseUrl, IProgress<PatchProgress> progress);
        
        // New Method for Patch Manifest
        Task<bool> ApplyPatchesAsync(string installPath, PatchManifest manifest, IProgress<PatchProgress> progress);
    }
}

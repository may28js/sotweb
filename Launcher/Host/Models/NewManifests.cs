using System.Collections.Generic;

namespace StoryOfTimeLauncher.Models
{
    // 1. Base Manifest (Local Check)
    public class BaseClientManifest
    {
        public List<BaseFileEntry> Files { get; set; } = new();
    }

    public class BaseFileEntry
    {
        public string RelativePath { get; set; } = string.Empty;
        public long Size { get; set; }
    }

    // 2. Patch Manifest (Remote Check)
    public class PatchManifest
    {
        public int Version { get; set; } // Patch Version ID
        public List<PatchEntry> Patches { get; set; } = new();
        public string BaseUrl { get; set; } = string.Empty; // URL to download patches
    }

    public class PatchEntry
    {
        public string RelativePath { get; set; } = string.Empty; 
        public string DownloadName { get; set; } = string.Empty; 
        public long Size { get; set; }
        public string Fingerprint { get; set; } = string.Empty; // Partial Hash (64KB*3)
        public string MD5 { get; set; } = string.Empty; // Full Hash (for strict check)
        public string Action { get; set; } = "add"; 
    }
}

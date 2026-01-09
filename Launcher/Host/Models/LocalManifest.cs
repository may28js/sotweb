using System.Collections.Generic;

namespace StoryOfTimeLauncher.Host.Models
{
    public class LocalManifestFile
    {
        public string RelativePath { get; set; } = string.Empty;
        public long Size { get; set; }
    }

    public class LocalManifest
    {
        public List<LocalManifestFile> Files { get; set; } = new List<LocalManifestFile>();
    }
}

using System.Collections.Generic;

namespace ManifestTool
{
    // --- 1. Base Manifest (对应 BaseClientManifest) ---
    // 用于嵌入启动器，定义“完整客户端”应包含哪些文件
    public class BaseClientManifest
    {
        public List<BaseFileEntry> Files { get; set; } = new();
    }

    public class BaseFileEntry
    {
        public string RelativePath { get; set; } = string.Empty;
        public long Size { get; set; }
    }

    // --- 2. Patch Manifest (对应 PatchManifest) ---
    // 用于服务器，定义“补丁更新”内容
    public class PatchManifest
    {
        public int Version { get; set; } // 补丁版本号 (例如 20260110)
        public string BaseUrl { get; set; } = string.Empty; // 补丁下载的基础URL
        public List<PatchEntry> Patches { get; set; } = new();
    }

    public class PatchEntry
    {
        public string RelativePath { get; set; } = string.Empty; 
        public string DownloadName { get; set; } = string.Empty; // 服务器上的文件名（通常和RelativePath一样，但可能扁平化）
        public long Size { get; set; }
        public string MD5 { get; set; } = string.Empty; // 完整MD5
        public string Action { get; set; } = "add"; // add, delete
    }
}

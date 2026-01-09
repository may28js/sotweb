using System;
using System.Collections.Generic;

namespace StoryOfTimeLauncher.Host.Models
{
    public enum FileType
    {
        Core,       // 核心文件，不可缺失 (e.g. Wow.exe, common.MPQ)
        Patch,      // 补丁文件，必须匹配 (e.g. patch-zhCN-T.MPQ)
        Config,     // 配置文件，可以重置 (e.g. Config.wtf)
        Optional    // 可选文件 (e.g. AddOns)
    }

    public class ClientFile
    {
        public string RelativePath { get; set; } = string.Empty;
        public string MD5 { get; set; } = string.Empty;
        public long Size { get; set; }
        public FileType Type { get; set; }
        public string DownloadUrl { get; set; } = string.Empty; // 备用，如果需要单独下载
    }

    public class LauncherUpdateConfig
    {
        public string Version { get; set; } = string.Empty;
        public string MD5 { get; set; } = string.Empty;
        public string DownloadUrl { get; set; } = string.Empty;
        public bool Mandatory { get; set; } = false;
    }

    public class ClientManifest
    {
        public string Version { get; set; } = "1.0.0";
        public DateTime LastUpdated { get; set; }
        public string BaseUrl { get; set; } = "https://shiguanggushi.xyz/patch/"; // 默认基础路径
        public string ClientDownloadUrl { get; set; } = string.Empty; // 完整客户端下载地址
        
        public LauncherUpdateConfig? Launcher { get; set; } // 启动器自更新配置

        public List<ClientFile> Components { get; set; } = new List<ClientFile>();
    }
}

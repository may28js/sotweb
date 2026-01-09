using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace ManifestGenerator
{
    // --- Models (Mirrored from Launcher Host) ---

    public enum FileType
    {
        Core,       // 核心文件，不可缺失
        Patch,      // 补丁文件，必须匹配
        Config,     // 配置文件，可以重置
        Optional    // 可选文件
    }

    public class ClientFile
    {
        public string RelativePath { get; set; } = string.Empty;
        public string MD5 { get; set; } = string.Empty;
        public long Size { get; set; }
        public FileType Type { get; set; }
        public string DownloadUrl { get; set; } = string.Empty;
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
        public string BaseUrl { get; set; } = "https://shiguanggushi.xyz/patch/";
        public string ClientDownloadUrl { get; set; } = string.Empty;
        
        public LauncherUpdateConfig? Launcher { get; set; }

        public List<ClientFile> Components { get; set; } = new List<ClientFile>();
    }

    // --- Program ---

    class Program
    {
        private static readonly HashSet<string> IgnoredDirectories = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Interface", "WTF", "Screenshots", "Logs", "Errors", "Cache", 
            "Quarantine", "runtimes", ".git", ".vs", "Tools"
        };

        private static readonly HashSet<string> IgnoredFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "ClientManifest.json", // Don't include the manifest itself
            "StoryOfTimeLauncher.exe", "StoryOfTimeLauncher.dll", "StoryOfTimeLauncher.pdb", 
            "WebView2Loader.dll", "D3DCompiler_47.dll", "PenImc_cor3.dll", "PresentationNative_cor3.dll", 
            "vcruntime140_cor3.dll", "wpfgfx_cor3.dll", "Launcher.exe", "ManifestGenerator.exe"
        };

        static async Task Main(string[] args)
        {
            string rootPath = args.Length > 0 ? args[0] : Directory.GetCurrentDirectory();
            rootPath = Path.GetFullPath(rootPath);

            Console.WriteLine($"Generating manifest for: {rootPath}");

            if (!Directory.Exists(rootPath))
            {
                Console.WriteLine("Error: Directory does not exist.");
                return;
            }

            var manifest = new ClientManifest
            {
                LastUpdated = DateTime.Now,
                Version = "1.0.0" // You might want to pass this as arg or read from a version file
            };

            await ScanDirectoryAsync(rootPath, rootPath, manifest.Components);

            var options = new JsonSerializerOptions { WriteIndented = true };
            string json = JsonSerializer.Serialize(manifest, options);

            string outputPath = Path.Combine(rootPath, "ClientManifest.json");
            await File.WriteAllTextAsync(outputPath, json);

            Console.WriteLine($"Manifest generated at: {outputPath}");
            Console.WriteLine($"Total files: {manifest.Components.Count}");
        }

        private static async Task ScanDirectoryAsync(string rootPath, string currentPath, List<ClientFile> components)
        {
            var dirInfo = new DirectoryInfo(currentPath);

            // Check Ignore List
            if (IgnoredDirectories.Contains(dirInfo.Name)) return;

            // Files
            foreach (var file in dirInfo.GetFiles())
            {
                if (IgnoredFiles.Contains(file.Name)) continue;
                // Ignore temporary files or others if needed
                if (file.Name.StartsWith(".")) continue;

                string relativePath = Path.GetRelativePath(rootPath, file.FullName).Replace("\\", "/");
                
                Console.WriteLine($"Processing: {relativePath}");

                string md5 = await ComputeMD5Async(file.FullName);
                FileType type = DetermineFileType(relativePath);

                components.Add(new ClientFile
                {
                    RelativePath = relativePath,
                    MD5 = md5,
                    Size = file.Length,
                    Type = type,
                    DownloadUrl = "" // Default empty, assumes BaseUrl + RelativePath
                });
            }

            // Subdirectories
            foreach (var dir in dirInfo.GetDirectories())
            {
                await ScanDirectoryAsync(rootPath, dir.FullName, components);
            }
        }

        private static FileType DetermineFileType(string relativePath)
        {
            string ext = Path.GetExtension(relativePath).ToLowerInvariant();
            string name = Path.GetFileName(relativePath).ToLowerInvariant();

            if (name == "config.wtf") return FileType.Config;
            if (name == "realmlist.wtf") return FileType.Config; // Or Core? Usually Config.
            
            // Patch files usually start with patch- and end with .mpq or .mpq.temp
            if (name.StartsWith("patch-") && (ext == ".mpq" || ext == ".mpq")) return FileType.Patch;
            
            // Addons could be Optional, but we are ignoring Interface folder generally.
            // If Interface folder is not ignored, then Addons would be Optional.
            
            return FileType.Core; // Default to Core
        }

        private static async Task<string> ComputeMD5Async(string filePath)
        {
            using (var md5 = MD5.Create())
            {
                using (var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    byte[] hashBytes = await md5.ComputeHashAsync(stream);
                    return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                }
            }
        }
    }
}

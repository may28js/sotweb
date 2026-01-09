using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Host.Models;

namespace StoryOfTimeLauncher.Host.Services
{
    public class GameScanner : IGameScanner
    {
        private const string GameExecutableName = "Wow.exe";
        
        // 需要保留的用户数据目录
        private readonly HashSet<string> _userDataDirectories = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Interface", "WTF", "Screenshots"
        };

        public ScanResult ScanDirectory(string path)
        {
            var result = new ScanResult();

            if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path))
            {
                result.IsValid = false;
                result.Message = "Directory does not exist.";
                return result;
            }

            // 1. Check Executable
            string exePath = Path.Combine(path, GameExecutableName);
            if (!File.Exists(exePath))
            {
                result.IsValid = false;
                result.Message = $"Missing {GameExecutableName}.";
                return result;
            }

            // 2. Check Data Folder (Basic validation)
            string dataPath = Path.Combine(path, "Data");
            if (!Directory.Exists(dataPath))
            {
                result.IsValid = false;
                result.Message = "Missing Data directory.";
                return result;
            }

            result.IsValid = true;
            result.Message = "Valid client found.";
            result.GameVersion = "3.3.5a"; 

            return result;
        }

        public async Task<List<string>> AutoDiscoverClientsAsync()
        {
            Console.WriteLine("[GameScanner] Starting Smart Auto-Discovery...");
            var foundPaths = new List<string>();
            
            await Task.Run(() =>
            {
                var scanPaths = GetHighProbabilityPaths();
                foreach (var path in scanPaths)
                {
                    if (!Directory.Exists(path)) continue;

                    Console.WriteLine($"[GameScanner] Scanning High-Prob Path: {path}");
                    
                    try
                    {
                        // 1. Check if the path itself is a client
                        if (CheckIfWowClient(path))
                        {
                            foundPaths.Add(path);
                        }

                        // 2. Check immediate subdirectories (Depth 1)
                        foreach (var subDir in Directory.GetDirectories(path))
                        {
                            // Skip system/hidden folders
                            var dirName = Path.GetFileName(subDir);
                            if (dirName.StartsWith(".") || 
                                dirName.StartsWith("$") || 
                                dirName.Equals("System Volume Information", StringComparison.OrdinalIgnoreCase) ||
                                dirName.Equals("Windows", StringComparison.OrdinalIgnoreCase) ||
                                dirName.Equals("Program Files", StringComparison.OrdinalIgnoreCase) ||
                                dirName.Equals("Program Files (x86)", StringComparison.OrdinalIgnoreCase))
                            {
                                continue;
                            }

                            if (CheckIfWowClient(subDir))
                            {
                                foundPaths.Add(subDir);
                            }
                        }
                    }
                    catch (Exception ex) 
                    {
                        Console.WriteLine($"[GameScanner] Error scanning {path}: {ex.Message}");
                    }
                }
            });

            var finalResults = foundPaths.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            Console.WriteLine($"[GameScanner] Discovery finished. Found {finalResults.Count} clients.");
            return finalResults;
        }

        private List<string> GetHighProbabilityPaths()
        {
            var paths = new List<string>();

            // 1. Launcher Directory & Parent
            string launcherDir = AppDomain.CurrentDomain.BaseDirectory;
            paths.Add(launcherDir);
            
            var parent = Directory.GetParent(launcherDir);
            if (parent != null) paths.Add(parent.FullName);

            // 2. Desktop & Downloads
            paths.Add(Environment.GetFolderPath(Environment.SpecialFolder.Desktop));
            try {
                string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                paths.Add(Path.Combine(userProfile, "Downloads"));
            } catch {}

            // 3. Drive Roots & Common WoW Paths
            foreach (var drive in DriveInfo.GetDrives().Where(d => d.IsReady && d.DriveType == DriveType.Fixed))
            {
                paths.Add(drive.Name); // e.g., C:\
                paths.Add(Path.Combine(drive.Name, "WoW"));
                paths.Add(Path.Combine(drive.Name, "World of Warcraft"));
                paths.Add(Path.Combine(drive.Name, "魔兽世界"));
                paths.Add(Path.Combine(drive.Name, "Games")); 
                paths.Add(Path.Combine(drive.Name, "Game"));
            }

            return paths.Distinct().ToList();
        }

        private bool CheckIfWowClient(string path)
        {
            if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path)) return false;
            
            // Check for Import Marker (Avoid incomplete clients)
            if (File.Exists(Path.Combine(path, StoryOfTimeLauncher.Services.GameService.ImportMarkerFile))) return false;

            try 
            {
                // 1. Check for Executable (Any .exe to allow renamed Launchers/WoW.exe)
                // User requirement: "IsWoWClient(path): if not exists(path/Wow.exe) return false"
                // But we allow ANY exe to support custom launchers/renamed exes as discussed.
                if (!Directory.GetFiles(path, "*.exe").Any()) return false;

                // 2. Check for Data/lichking.MPQ (The Strongest Indicator for 3.3.5a)
                string dataPath = Path.Combine(path, "Data");
                if (!Directory.Exists(dataPath)) return false;

                // Search recursively in Data for lichking.MPQ
                bool hasLichKing = Directory.GetFiles(dataPath, "lichking.MPQ", SearchOption.AllDirectories).Any();
                
                if (hasLichKing)
                {
                    Console.WriteLine($"[GameScanner] Valid 3.3.5a found: {path}");
                    return true;
                }
            }
            catch (Exception) { /* Ignore */ }

            return false;
        }

        public async Task ImportClientAsync(string sourcePath, string targetPath, ClientManifest? manifest, IProgress<TransferProgress>? progress = null, PauseToken? pauseToken = null)
        {
            if (string.Equals(Path.GetFullPath(sourcePath), Path.GetFullPath(targetPath), StringComparison.OrdinalIgnoreCase))
            {
                return; // Same directory
            }

            if (!Directory.Exists(targetPath))
            {
                Directory.CreateDirectory(targetPath);
            }

            // 构建白名单查表 (相对路径 -> ClientFile)
            Dictionary<string, ClientFile>? manifestMap = null;
            if (manifest != null && manifest.Components != null)
            {
                manifestMap = manifest.Components.ToDictionary(
                    f => f.RelativePath.Replace("\\", "/"), 
                    f => f, 
                    StringComparer.OrdinalIgnoreCase
                );
            }

            await Task.Run(async () =>
            {
                await CopyValidFiles(sourcePath, targetPath, manifestMap, progress, pauseToken);
            });
        }

        private async Task CopyValidFiles(string sourceDir, string destDir, Dictionary<string, ClientFile>? manifestMap, IProgress<TransferProgress>? progress, PauseToken? pauseToken)
        {
            var dirInfo = new DirectoryInfo(sourceDir);
            if (!dirInfo.Exists) return;

            // 1. Scan files first to calculate total size
            var allFiles = dirInfo.GetFiles("*", SearchOption.AllDirectories);
            long totalBytes = 0;
            var filesToCopy = new List<FileInfo>();

            foreach (var file in allFiles)
            {
                string relativePath = Path.GetRelativePath(sourceDir, file.FullName).Replace("\\", "/");
                bool shouldCopy = false;

                if (manifestMap == null)
                {
                    shouldCopy = true; 
                }
                else 
                {
                    if (manifestMap.ContainsKey(relativePath))
                    {
                        shouldCopy = true;
                    }
                    // Pure Import: If manifest is present, we strictly follow it.
                    // We do NOT automatically include user data directories (Interface, WTF, etc.)
                    // because the source client might be "dirty".
                }

                if (shouldCopy)
                {
                    filesToCopy.Add(file);
                    totalBytes += file.Length;
                }
            }

            // 2. Start Copying with Stream
            long processedBytes = 0;
            byte[] buffer = new byte[81920]; // 80KB buffer

            foreach (var file in filesToCopy)
            {
                if (pauseToken != null) await pauseToken.WaitWhilePausedAsync();

                string relativePath = Path.GetRelativePath(sourceDir, file.FullName).Replace("\\", "/");
                string targetFilePath = Path.Combine(destDir, relativePath);
                string? targetDir = Path.GetDirectoryName(targetFilePath);
                
                if (!string.IsNullOrEmpty(targetDir) && !Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                // Stream Copy
                using (var sourceStream = new FileStream(file.FullName, FileMode.Open, FileAccess.Read, FileShare.Read))
                using (var destStream = new FileStream(targetFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    int bytesRead;
                    long fileProcessed = 0;
                    while ((bytesRead = sourceStream.Read(buffer, 0, buffer.Length)) > 0)
                    {
                        if (pauseToken != null) await pauseToken.WaitWhilePausedAsync();

                        destStream.Write(buffer, 0, bytesRead);
                        processedBytes += bytesRead;
                        fileProcessed += bytesRead;

                        // Report progress periodically (e.g. every 1MB or 1% change)
                        // To avoid spamming, we can check if percentage changed significantly or byte count
                        if (progress != null && processedBytes % (1024 * 1024) == 0) // Report every 1MB
                        {
                            progress.Report(new TransferProgress 
                            { 
                                TotalBytes = totalBytes, 
                                ProcessedBytes = processedBytes, 
                                CurrentFileName = file.Name 
                            });
                        }
                    }
                }
                
                // Final report for this file
                progress?.Report(new TransferProgress 
                { 
                    TotalBytes = totalBytes, 
                    ProcessedBytes = processedBytes, 
                    CurrentFileName = file.Name 
                });
            }
        }
    }
}

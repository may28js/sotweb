using System;
using System.Diagnostics;
using System.IO;

namespace StoryOfTimeLauncher.Services
{
    public class GameService
    {
        private const string GameExecutableName = "Wow.exe";
        public const string ImportMarkerFile = ".import_pending";

        public bool IsGameInstalled(string installPath)
        {
            if (string.IsNullOrEmpty(installPath)) return false;
            
            string fullPath = Path.Combine(installPath, GameExecutableName);
            return File.Exists(fullPath);
        }

        public void UpdateRealmlist(string installPath, string realmlistAddress)
        {
            if (string.IsNullOrEmpty(installPath)) return;

            string content = $"set realmlist {realmlistAddress}";
            bool updated = false;

            // 1. Try to find and update existing realmlist files
            // Priority: Data/zhCN -> Data/enCN -> Data/enUS -> Data/
            string[] potentialPaths = new[]
            {
                Path.Combine(installPath, "Data", "zhCN", "realmlist.wtf"),
                Path.Combine(installPath, "Data", "enCN", "realmlist.wtf"),
                Path.Combine(installPath, "Data", "enUS", "realmlist.wtf"),
                Path.Combine(installPath, "Data", "realmlist.wtf"),
                Path.Combine(installPath, "realmlist.wtf") // Some private servers put it in root
            };

            foreach (string path in potentialPaths)
            {
                if (File.Exists(path))
                {
                    try
                    {
                        // Remove read-only attribute if present
                        var fileInfo = new FileInfo(path);
                        if (fileInfo.IsReadOnly)
                        {
                            fileInfo.IsReadOnly = false;
                        }
                        
                        File.WriteAllText(path, content);
                        updated = true;
                    }
                    catch (Exception ex)
                    {
                        // Log error but continue trying other paths
                        System.Diagnostics.Debug.WriteLine($"Failed to update realmlist at {path}: {ex.Message}");
                    }
                }
            }

            // 2. If no realmlist found, create one in a standard location
            if (!updated)
            {
                try
                {
                    string dataPath = Path.Combine(installPath, "Data");
                    if (!Directory.Exists(dataPath)) Directory.CreateDirectory(dataPath);

                    string zhCN = Path.Combine(dataPath, "zhCN");
                    if (!Directory.Exists(zhCN)) Directory.CreateDirectory(zhCN);
                    
                    string targetPath = Path.Combine(zhCN, "realmlist.wtf");
                    File.WriteAllText(targetPath, content);
                }
                catch (Exception ex)
                {
                     System.Diagnostics.Debug.WriteLine($"Failed to create new realmlist: {ex.Message}");
                }
            }
        }

        public void LaunchGame(string installPath)
        {
            if (!IsGameInstalled(installPath))
            {
                throw new FileNotFoundException("Game executable not found.");
            }

            string fullPath = Path.Combine(installPath, GameExecutableName);
            
            ProcessStartInfo startInfo = new ProcessStartInfo
            {
                FileName = fullPath,
                WorkingDirectory = installPath,
                UseShellExecute = false
            };

            Process.Start(startInfo);
        }
    }
}

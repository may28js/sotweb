using System;
using System.Diagnostics;
using System.IO;

namespace StoryOfTimeLauncher.Services
{
    public class GameService
    {
        private const string GameExecutableName = "Wow.exe";

        public bool IsGameInstalled(string installPath)
        {
            if (string.IsNullOrEmpty(installPath)) return false;
            
            string fullPath = Path.Combine(installPath, GameExecutableName);
            return File.Exists(fullPath);
        }

        public void UpdateRealmlist(string installPath, string realmlistAddress)
        {
            if (string.IsNullOrEmpty(installPath)) return;

            string[] potentialPaths = new[]
            {
                Path.Combine(installPath, "Data", "zhCN", "realmlist.wtf"),
                Path.Combine(installPath, "Data", "enCN", "realmlist.wtf"),
                Path.Combine(installPath, "Data", "enUS", "realmlist.wtf"),
                Path.Combine(installPath, "Data", "realmlist.wtf")
            };

            string content = $"set realmlist {realmlistAddress}";
            bool updated = false;

            foreach (string path in potentialPaths)
            {
                if (File.Exists(path))
                {
                    File.WriteAllText(path, content);
                    updated = true;
                }
            }

            if (!updated)
            {
                string dataPath = Path.Combine(installPath, "Data");
                if (Directory.Exists(dataPath))
                {
                    string zhCN = Path.Combine(dataPath, "zhCN");
                    if (!Directory.Exists(zhCN)) Directory.CreateDirectory(zhCN);
                    File.WriteAllText(Path.Combine(zhCN, "realmlist.wtf"), content);
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

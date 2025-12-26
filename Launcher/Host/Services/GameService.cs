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

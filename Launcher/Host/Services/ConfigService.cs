using System;
using System.IO;
using System.Text.Json;
using StoryOfTimeLauncher.Models;

namespace StoryOfTimeLauncher.Services
{
    public class ConfigService
    {
        private const string ConfigFileName = "launcher_config.json";
        private readonly string _configPath;
        public AppConfig CurrentConfig { get; private set; } = new AppConfig();

        public ConfigService()
        {
            _configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ConfigFileName);
            LoadConfig();
        }

        private void LoadConfig()
        {
            if (File.Exists(_configPath))
            {
                try
                {
                    string json = File.ReadAllText(_configPath);
                    CurrentConfig = JsonSerializer.Deserialize<AppConfig>(json) ?? new AppConfig();
                }
                catch
                {
                    CurrentConfig = new AppConfig();
                }
            }
            else
            {
                CurrentConfig = new AppConfig();
            }
        }

        public void SaveConfig()
        {
            try
            {
                string json = JsonSerializer.Serialize(CurrentConfig, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(_configPath, json);
            }
            catch
            {
                // Handle save error if needed
            }
        }
    }
}

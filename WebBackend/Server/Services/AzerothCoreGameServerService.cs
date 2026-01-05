using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using Renci.SshNet;
using StoryOfTime.Server.Controllers;
using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;

namespace StoryOfTime.Server.Services
{
    public class AzerothCoreGameServerService : IGameServerService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AzerothCoreGameServerService> _logger;

        public AzerothCoreGameServerService(ApplicationDbContext context, ILogger<AzerothCoreGameServerService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private async Task<GameServerSetting?> GetSettingsAsync()
        {
            return await _context.GameServerSettings.FirstOrDefaultAsync();
        }

        public async Task<ServerStatusDto> GetStatusAsync()
        {
            var settings = await GetSettingsAsync();
            
            var status = new ServerStatusDto
            {
                Status = "Offline",
                MaxPlayers = 1000, // Configurable?
                Uptime = "N/A"
            };

            if (settings == null) return status;

            try
            {
                // 1. Get Online Players from MySQL
                var connectionString = $"Server={settings.Host};Port={settings.Port};Database={settings.CharactersDatabase};Uid={settings.Username};Pwd={settings.Password};";
                
                if (!string.IsNullOrEmpty(connectionString))
                {
                    using var connection = new MySqlConnection(connectionString);
                    await connection.OpenAsync();
                    using var command = new MySqlCommand("SELECT COUNT(*) FROM characters WHERE online = 1", connection);
                    var count = Convert.ToInt32(await command.ExecuteScalarAsync());
                    status.OnlinePlayers = count;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to query characters database");
            }

            try
            {
                // 2. Get System Stats via SSH
                if (!string.IsNullOrEmpty(settings.SshHost) && !string.IsNullOrEmpty(settings.SshPassword))
                {
                    using var client = new SshClient(settings.SshHost, settings.SshPort, settings.SshUsername, settings.SshPassword);
                    client.Connect();

                    if (client.IsConnected)
                    {
                        // Check if services are active
                        var worldStatusCmd = client.CreateCommand($"systemctl is-active {settings.WorldServiceName}");
                        var worldServiceStatus = worldStatusCmd.Execute().Trim();

                        var authStatusCmd = client.CreateCommand($"systemctl is-active {settings.AuthServiceName}");
                        var authServiceStatus = authStatusCmd.Execute().Trim();
                        
                        // Treat 'active' or 'activating' as running, otherwise offline
                        if ((worldServiceStatus == "active" || worldServiceStatus == "activating") && 
                            (authServiceStatus == "active" || authServiceStatus == "activating"))
                        {
                            status.Status = "Online";

                            // Get CPU core count
                            var coresCmd = client.CreateCommand("nproc");
                            var coresStr = coresCmd.Execute().Trim();
                            int coreCount = 1;
                            int.TryParse(coresStr, out coreCount);
                            if (coreCount < 1) coreCount = 1;

                            // Get CPU and Memory usage of the process
                            // Try service name first, then fallback to 'worldserver' binary name
                            string processName = settings.WorldServiceName.Replace(".service", "");
                            var statsCmd = client.CreateCommand($"ps -C {processName} -o %cpu,%mem --no-headers");
                            var result = statsCmd.Execute().Trim();

                            if (string.IsNullOrEmpty(result))
                            {
                                // Fallback to 'worldserver'
                                statsCmd = client.CreateCommand($"ps -C worldserver -o %cpu,%mem --no-headers");
                                result = statsCmd.Execute().Trim();
                                processName = "worldserver"; // Update for uptime check
                            }
                            
                            if (!string.IsNullOrEmpty(result))
                            {
                                // If multiple processes match (e.g. multiple threads shown as processes in some ps versions, or multiple instances), 
                                // ps -C might return multiple lines. We should sum them or take the top one.
                                // With --no-headers, we just get values.
                                // Let's handle multi-line by summing.
                                var lines = result.Split('\n', StringSplitOptions.RemoveEmptyEntries);
                                double totalCpu = 0;
                                double totalMem = 0;

                                foreach (var line in lines)
                                {
                                    var parts = line.Trim().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                                    if (parts.Length >= 2)
                                    {
                                        if (double.TryParse(parts[0], out double cpu)) totalCpu += cpu;
                                        if (double.TryParse(parts[1], out double mem)) totalMem += mem;
                                    }
                                }
                                
                                status.CpuUsage = (int)(totalCpu / coreCount); // Normalize to 0-100%
                                status.MemoryUsage = (int)totalMem;
                            }
                            
                            // Get Uptime
                            var uptimeCmd = client.CreateCommand($"ps -C {processName} -o etimes --no-headers | head -n 1");

                            var uptimeStr = uptimeCmd.Execute().Trim();
                            if (long.TryParse(uptimeStr, out long uptimeSeconds))
                            {
                                TimeSpan t = TimeSpan.FromSeconds(uptimeSeconds);
                                status.Uptime = $"{t.Days}d {t.Hours}h {t.Minutes}m";
                            }
                        }
                        else
                        {
                            var statusList = new List<string>();
                            if (worldServiceStatus != "active") statusList.Add($"World: {worldServiceStatus}");
                            if (authServiceStatus != "active") statusList.Add($"Auth: {authServiceStatus}");
                            status.Status = string.Join(", ", statusList);
                        }
                        
                        client.Disconnect();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect via SSH");
                status.Status = "Unknown";
            }

            return status;
        }

        public async Task<List<OnlineHistoryDto>> GetHistoryAsync(string period = "24h")
        {
            var now = DateTime.UtcNow;
            DateTime cutoff;
            int intervalMinutes;
            int totalPoints;
            string format;

            // Determine range and granularity
            switch (period.ToLower())
            {
                case "1h":
                    cutoff = now.AddHours(-1);
                    intervalMinutes = 1; // 1 min
                    totalPoints = 60;
                    format = "HH:mm";
                    break;
                case "7d":
                    cutoff = now.AddDays(-7);
                    intervalMinutes = 60; // Hourly
                    totalPoints = 24 * 7; 
                    format = "MM-dd HH:mm";
                    break;
                case "30d":
                    cutoff = now.AddDays(-30);
                    intervalMinutes = 240; // 4 hours
                    totalPoints = 6 * 30;
                    format = "MM-dd HH:mm";
                    break;
                case "24h":
                default:
                    cutoff = now.AddHours(-24);
                    intervalMinutes = 5; // 5 mins
                    totalPoints = 288;
                    format = "HH:mm";
                    break;
            }
            
            var logs = await _context.ServerStatusLogs
                .Where(x => x.Timestamp >= cutoff)
                .ToListAsync();

            var history = new List<OnlineHistoryDto>();
            
            // Generate points
            for (int i = totalPoints; i >= 0; i--)
            {
                var timePoint = now.AddMinutes(-i * intervalMinutes);
                
                // Define window
                var windowStart = timePoint.AddMinutes(-intervalMinutes / 2.0);
                var windowEnd = timePoint.AddMinutes(intervalMinutes / 2.0);

                var logsInWindow = logs.Where(x => x.Timestamp >= windowStart && x.Timestamp < windowEnd).ToList();
                
                int players = 0;
                if (logsInWindow.Any())
                {
                    players = (int)Math.Round(logsInWindow.Average(x => x.OnlinePlayers));
                }
                
                // Convert to UTC+8 for display
                var localTime = timePoint.AddHours(8);

                history.Add(new OnlineHistoryDto
                {
                    Time = localTime.ToString(format),
                    Players = players
                });
            }

            // Generate future points (padding for chart)
            int futurePoints = totalPoints / 3; 
            for (int i = 1; i <= futurePoints; i++)
            {
                var timePoint = now.AddMinutes(i * intervalMinutes);
                var localTime = timePoint.AddHours(8);
                
                history.Add(new OnlineHistoryDto
                {
                    Time = localTime.ToString(format),
                    Players = null
                });
            }

            return history;
        }

        public async Task<bool> ControlServerAsync(string action)
        {
            var settings = await GetSettingsAsync();
            if (settings == null || string.IsNullOrEmpty(settings.SshHost) || string.IsNullOrEmpty(settings.SshPassword))
            {
                _logger.LogWarning("SSH credentials not configured for server control");
                return false;
            }

            try
            {
                using var client = new SshClient(settings.SshHost, settings.SshPort, settings.SshUsername, settings.SshPassword);
                client.Connect();

                string commandStr = "";
                switch (action.ToLower())
                {
                    case "start":
                        commandStr = $"systemctl start {settings.WorldServiceName}";
                        break;
                    case "stop":
                        commandStr = $"systemctl stop {settings.WorldServiceName}";
                        break;
                    case "restart":
                        commandStr = $"systemctl restart {settings.WorldServiceName}";
                        break;
                    default:
                        return false;
                }

                var cmd = client.CreateCommand(commandStr);
                var result = cmd.Execute();
                
                _logger.LogInformation($"Executed {action}: {result}");
                
                client.Disconnect();
                return true; // Assuming success if no exception, systemctl usually returns 0
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to execute {action} via SSH");
                return false;
            }
        }
    }
}

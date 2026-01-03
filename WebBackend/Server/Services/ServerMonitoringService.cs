using StoryOfTime.Server.Data;
using StoryOfTime.Server.Models;

namespace StoryOfTime.Server.Services
{
    public class ServerMonitoringService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ServerMonitoringService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromMinutes(1); // Record every 1 minute

        public ServerMonitoringService(IServiceProvider serviceProvider, ILogger<ServerMonitoringService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Server Monitoring Service is starting.");

            // Record immediately on start
            await RecordStatusAsync();

            using var timer = new PeriodicTimer(_period);
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await RecordStatusAsync();
            }
        }

        private async Task RecordStatusAsync()
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var gameService = scope.ServiceProvider.GetRequiredService<IGameServerService>();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Get current status
                var status = await gameService.GetStatusAsync();

                // Create log entry
                var log = new ServerStatusLog
                {
                    Timestamp = DateTime.UtcNow,
                    OnlinePlayers = status.OnlinePlayers,
                    CpuUsage = status.CpuUsage,
                    MemoryUsage = status.MemoryUsage,
                    Status = status.Status
                };

                dbContext.ServerStatusLogs.Add(log);
                
                // Optional: Cleanup old logs (keep last 30 days)
                var cutoff = DateTime.UtcNow.AddDays(-30);
                var oldLogs = dbContext.ServerStatusLogs.Where(x => x.Timestamp < cutoff);
                if (oldLogs.Any())
                {
                    dbContext.ServerStatusLogs.RemoveRange(oldLogs);
                }

                await dbContext.SaveChangesAsync();
                _logger.LogInformation($"Recorded server status: {status.OnlinePlayers} players online.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording server status.");
            }
        }
    }
}

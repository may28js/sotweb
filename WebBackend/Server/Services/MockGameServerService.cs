using StoryOfTime.Server.Controllers;

namespace StoryOfTime.Server.Services
{
    public class MockGameServerService : IGameServerService
    {
        public Task<ServerStatusDto> GetStatusAsync()
        {
            var random = new Random();
            return Task.FromResult(new ServerStatusDto
            {
                Status = "Online",
                CpuUsage = random.Next(20, 60),
                MemoryUsage = random.Next(40, 80),
                OnlinePlayers = random.Next(100, 500),
                MaxPlayers = 1000,
                Uptime = "3d 12h 45m"
            });
        }

        public Task<List<OnlineHistoryDto>> GetHistoryAsync(string period = "24h")
        {
            // Simple mock data
            var history = new List<OnlineHistoryDto>();
            // ... mock implementation omitted for brevity as main service is AzerothCore ...
            // Just return empty for now to satisfy interface
            return Task.FromResult(history);
        }

        public async Task<bool> ControlServerAsync(string action)
        {
            // Simulate delay
            await Task.Delay(1000);
            return true; 
        }
    }
}

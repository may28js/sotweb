using StoryOfTime.Server.Controllers;

namespace StoryOfTime.Server.Services
{
    public interface IGameServerService
    {
        Task<ServerStatusDto> GetStatusAsync();
        Task<List<OnlineHistoryDto>> GetHistoryAsync(string period = "24h");
        Task<bool> ControlServerAsync(string action);
    }
}

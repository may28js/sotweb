using System.Threading.Tasks;

namespace StoryOfTimeLauncher.Host.Models
{
    public class PauseToken
    {
        public bool IsPaused { get; set; }
        public async Task WaitWhilePausedAsync()
        {
            while (IsPaused)
            {
                await Task.Delay(100);
            }
        }
    }
}

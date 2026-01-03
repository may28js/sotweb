namespace StoryOfTime.Server.Services
{
    public class GameServerOptions
    {
        public const string SectionName = "GameServer";

        public string Host { get; set; } = "127.0.0.1";
        public int SshPort { get; set; } = 22;
        public string SshUsername { get; set; } = "root";
        public string SshPassword { get; set; } = "";
        
        // MySQL connection string for the characters database
        public string CharactersDbConnectionString { get; set; } = "";
        
        // Systemd service name for the world server
        public string WorldServiceName { get; set; } = "acore-worldserver";
    }
}

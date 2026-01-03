using System.ComponentModel.DataAnnotations;

namespace StoryOfTime.Server.Models
{
    public class GameServerSetting
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Host { get; set; } = "127.0.0.1";

        public int Port { get; set; } = 3306;

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = "acore";

        [Required]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string AuthDatabase { get; set; } = "acore_auth";

        [Required]
        [MaxLength(50)]
        public string CharactersDatabase { get; set; } = "acore_characters";

        // SOAP Settings
        [Required]
        [MaxLength(100)]
        public string SoapHost { get; set; } = "127.0.0.1";

        public int SoapPort { get; set; } = 7878;

        [Required]
        [MaxLength(50)]
        public string SoapUsername { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string SoapPassword { get; set; } = string.Empty;

        // SSH / Monitor Settings
        [MaxLength(100)]
        public string SshHost { get; set; } = "127.0.0.1";

        public int SshPort { get; set; } = 22;

        [MaxLength(50)]
        public string SshUsername { get; set; } = "root";

        [MaxLength(100)]
        public string SshPassword { get; set; } = string.Empty;

        [MaxLength(100)]
        public string WorldServiceName { get; set; } = "acore-worldserver";

        [MaxLength(100)]
        public string AuthServiceName { get; set; } = "acore-authserver";
    }
}

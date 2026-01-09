using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Host.Models;
using StoryOfTimeLauncher.Models;

namespace StoryOfTimeLauncher.Host.Services
{
    public class SanitizationReport
    {
        public List<string> QuarantinedFiles { get; set; } = new List<string>();
        public List<string> RemovedFiles { get; set; } = new List<string>(); // e.g. Cache files
        public List<string> MismatchedFiles { get; set; } = new List<string>(); // Files that need repair
    }
}

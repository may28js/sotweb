using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Reflection;
using System.Threading.Tasks;
using System.Windows;

namespace StoryOfTimeLauncher.Host.Services
{
    public class UpdateService
    {
        private readonly HttpClient _httpClient;
        // NOTE: This URL should match the backend controller
        private const string ConfigUrl = "https://shiguanggushi.xyz/patch/launcher/version.json";
        
        public string? LatestVersion { get; private set; }
        public string? DownloadUrl { get; private set; }

        public UpdateService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<bool> CheckForUpdatesAsync()
        {
            try
            {
                // Add timestamp to prevent caching
                var url = $"{ConfigUrl}?t={DateTime.Now.Ticks}";
                var config = await _httpClient.GetFromJsonAsync<LauncherConfigDto>(url);
                
                if (config == null || string.IsNullOrEmpty(config.LatestVersion)) 
                    return false;

                LatestVersion = config.LatestVersion?.Trim(); // Trim whitespace
                DownloadUrl = config.DownloadUrl?.Trim(' ', '`', '\'', '"', '\r', '\n', '\t'); // Clean up URL thoroughly

                var currentVersion = Assembly.GetExecutingAssembly().GetName().Version;
                
                Console.WriteLine($"[UpdateService] Checking updates. Local: {currentVersion}, Remote: {LatestVersion}, URL: {DownloadUrl}");

                if (string.IsNullOrEmpty(LatestVersion))
                {
                    Console.WriteLine("[UpdateService] Remote version is empty.");
                    return false;
                }

                if (Version.TryParse(LatestVersion, out var remoteVersion))
                {
                     // Debug: Force update if versions are equal for testing? No.
                     if (remoteVersion > currentVersion)
                     {
                         Console.WriteLine("[UpdateService] Update found!");
                         return true;
                     }
                }
                else
                {
                     Console.WriteLine($"[UpdateService] Failed to parse remote version: {LatestVersion}");
                }
                
                Console.WriteLine("[UpdateService] No update found.");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UpdateService] Update check failed: {ex.Message}");
                // Debug.WriteLine($"Update check failed: {ex.Message}");
                return false;
            }
        }

        public async Task DownloadAndInstallAsync(IProgress<double> progress)
        {
            if (string.IsNullOrEmpty(DownloadUrl)) return;

            string tempPath = Path.Combine(Path.GetTempPath(), "StoryOfTimeLauncher_Setup.exe");

            try 
            {
                using (var response = await _httpClient.GetAsync(DownloadUrl, HttpCompletionOption.ResponseHeadersRead))
                {
                    response.EnsureSuccessStatusCode();
                    var totalBytes = response.Content.Headers.ContentLength ?? -1L;
                    var canReportProgress = totalBytes != -1 && progress != null;

                    using (var contentStream = await response.Content.ReadAsStreamAsync())
                    using (var fileStream = new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true))
                    {
                        var buffer = new byte[8192];
                        long totalRead = 0;
                        int read;

                        while ((read = await contentStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                        {
                            await fileStream.WriteAsync(buffer, 0, read);
                            totalRead += read;

                            if (canReportProgress)
                            {
                                progress.Report((double)totalRead / totalBytes * 100);
                            }
                        }
                    }
                }

                // Run Installer
                var psi = new ProcessStartInfo
                {
                    FileName = tempPath,
                    // Remove /SUPPRESSMSGBOXES to show errors if any
                    // Use /SILENT to show progress but no wizard
                    Arguments = "/SILENT /SP-",
                    UseShellExecute = true,
                    Verb = "runas" // Request admin privileges
                };
                
                Process.Start(psi);
                
                // Exit immediately to allow installer to proceed
                System.Windows.Application.Current.Shutdown();
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Download failed: {ex.Message}");
                throw; 
            }
        }
    }

    public class LauncherConfigDto
    {
        public string? LatestVersion { get; set; }
        public string? DownloadUrl { get; set; }
    }
}

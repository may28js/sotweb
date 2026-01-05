using System;
using System.Windows;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;
using System.Runtime.InteropServices;
using System.Windows.Interop;
using System.Text.Json;
using StoryOfTimeLauncher.Services;
using StoryOfTimeLauncher.Models;
using FolderBrowserDialog = System.Windows.Forms.FolderBrowserDialog;
using DialogResult = System.Windows.Forms.DialogResult;

namespace StoryOfTimeLauncher
{
    public partial class MainWindow : Window
    {
        private readonly ConfigService _configService;
        private readonly GameService _gameService;
        private readonly IDownloadService _downloadService;

        private const string GameDownloadUrl = "https://btground.tk/chmi/ChromieCraft_3.3.5a.zip";
        private string _currentRealmlist = "shiguanggushi.xyz";

        public MainWindow()
        {
            InitializeComponent();
            _configService = new ConfigService();
            _gameService = new GameService();
            
            _downloadService = new DownloadService();
            _downloadService.ProgressChanged += DownloadService_ProgressChanged;
            _downloadService.DownloadCompleted += DownloadService_DownloadCompleted;
            _downloadService.DownloadError += DownloadService_DownloadError;

            InitializeAsync();
            this.Loaded += MainWindow_Loaded;
            this.SizeChanged += MainWindow_SizeChanged;
        }

        private void MainWindow_Loaded(object? sender, RoutedEventArgs e)
        {
            SetRoundedRegion();
        }

        private void MainWindow_SizeChanged(object? sender, SizeChangedEventArgs e)
        {
            SetRoundedRegion();
        }

        private void SetRoundedRegion()
        {
            // Create a rounded rect region for the window to clip the square corners
            // The radius should match the frontend (rounded-lg is approx 8px)
            IntPtr hRgn = CreateRoundRectRgn(0, 0, (int)this.ActualWidth + 1, (int)this.ActualHeight + 1, 16, 16);
            SetWindowRgn(new WindowInteropHelper(this).Handle, hRgn, true);
        }

        async void InitializeAsync()
        {
            try
            {
                // Ensure the CoreWebView2 environment is initialized
                await webView.EnsureCoreWebView2Async();
                
                // Set the default background color to transparent to match the window
                webView.DefaultBackgroundColor = System.Drawing.Color.Transparent;

                // Handle messages from the frontend
                webView.WebMessageReceived += WebView_WebMessageReceived;

                // Navigate to the frontend
                // Check for local index.html (Production)
                string localIndex = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "index.html");
                if (File.Exists(localIndex))
                {
                    webView.CoreWebView2.Navigate(localIndex);
                }
                else
                {
                    // Fallback to Dev Server
                    webView.CoreWebView2.Navigate("http://localhost:5173");
                }
                
                // Check game status after navigation (give it a moment to load)
                // In a real app, we might wait for a "frontend_ready" message
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show("Failed to initialize WebView2: " + ex.Message);
            }
        }

        private void WebView_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string json = e.WebMessageAsJson;
                
                // Quick check for drag (performance optimization)
                if (json.Contains("\"type\":\"drag\"") || json.Contains("\"type\": \"drag\""))
                {
                    ReleaseCapture();
                    SendMessage(new WindowInteropHelper(this).Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                    return;
                }

                var message = JsonSerializer.Deserialize<IpcMessage>(json);
                if (message == null) return;

                switch (message.Type)
                {
                    case "app_ready":
                        CheckAndSendGameStatus();
                        break;
                    case "minimize":
                        this.WindowState = WindowState.Minimized;
                        break;
                    case "close":
                        this.Close();
                        break;
                    case "select_install_path":
                        SelectInstallPath();
                        break;
                    case "launch_game":
                        LaunchGame();
                        break;
                    case "install_game":
                        InstallGame();
                        break;
                    case "start_download":
                        HandleStartDownload(message);
                        break;
                    case "pause_download":
                        _downloadService.PauseDownload();
                        break;
                    case "resume_download":
                        _downloadService.ResumeDownload();
                        break;
                    case "set_realmlist":
                        if (message.Payload is JsonElement payload && payload.TryGetProperty("realmlist", out var realmlistProp))
                        {
                            string r = realmlistProp.GetString();
                             if (!string.IsNullOrEmpty(r))
                             {
                                 _currentRealmlist = r;
                                 string installPath = _configService.CurrentConfig.InstallPath;
                                 if (!string.IsNullOrEmpty(installPath))
                                 {
                                     _gameService.UpdateRealmlist(installPath, r);
                                 }
                             }
                        }
                        break;
                }
            }
            catch (Exception)
            {
                // Ignore errors
            }
        }

        private void SelectInstallPath()
        {
            using (var dialog = new System.Windows.Forms.FolderBrowserDialog())
            {
                dialog.Description = "Select World of Warcraft 3.3.5a Installation Folder";
                dialog.UseDescriptionForTitle = true;
                
                System.Windows.Forms.DialogResult result = dialog.ShowDialog();

                if (result == System.Windows.Forms.DialogResult.OK)
                {
                    string path = dialog.SelectedPath;
                    if (_gameService.IsGameInstalled(path))
                    {
                        _configService.CurrentConfig.InstallPath = path;
                        _configService.SaveConfig();
                        SendToFrontend("game_status", new { status = "ready", path = path });
                    }
                    else
                    {
                        // For now, if game not found, we just update path but status is not_installed
                        // Or maybe we want to trigger download?
                        // Let's assume user selected a folder where they WANT to install
                        _configService.CurrentConfig.InstallPath = path;
                        _configService.SaveConfig();
                        SendToFrontend("game_status", new { status = "not_installed", path = path });
                    }
                }
            }
        }

        private void InstallGame()
        {
            try
            {
                // Use default "client" folder in the launcher's directory
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string installPath = System.IO.Path.Combine(baseDir, "client");

                if (!Directory.Exists(installPath))
                {
                    Directory.CreateDirectory(installPath);
                }

                _configService.CurrentConfig.InstallPath = installPath;
                _configService.SaveConfig();

                // Notify frontend
                SendToFrontend("game_status", new { status = "installing", path = installPath });

                // Start Download
                string url = GameDownloadUrl;
                string zipDest = System.IO.Path.Combine(installPath, "WoW_Client.zip");
                
                // Ensure DownloadService is ready and clean previous states if any
                _downloadService.StartDownload(url, zipDest);
            }
            catch (Exception ex)
            {
                SendToFrontend("error", new { message = "安装初始化失败: " + ex.Message });
            }
        }

        private void LaunchGame()
        {
            string? path = _configService.CurrentConfig.InstallPath;
            if (string.IsNullOrEmpty(path)) return;

            try
            {
                _gameService.UpdateRealmlist(path, _currentRealmlist);
                _gameService.LaunchGame(path);
                SendToFrontend("game_launched");
                // Optional: Minimize launcher
                // this.WindowState = WindowState.Minimized;
            }
            catch (Exception ex)
            {
                SendToFrontend("error", new { message = "Launch failed: " + ex.Message });
            }
        }

        private void CheckAndSendGameStatus()
        {
            string? path = _configService.CurrentConfig.InstallPath;
            if (string.IsNullOrEmpty(path))
            {
                SendToFrontend("game_status", new { status = "not_configured" });
            }
            else if (_gameService.IsGameInstalled(path))
            {
                SendToFrontend("game_status", new { status = "ready", path = path });
            }
            else
            {
                // Path exists but game not found. Check if downloading
                if (_downloadService.IsDownloading)
                {
                     // If download service is active, we should sync state
                     // But here we mainly handle initial load.
                     // If app restarted, download service is reset.
                     // So we treat it as 'not_installed' but preserve path so user can 'Resume' or 'Install'
                }
                
                SendToFrontend("game_status", new { status = "not_installed", path = path });
            }
        }

        private void HandleStartDownload(IpcMessage message)
        {
             string url = GameDownloadUrl;
             if (message.Payload is JsonElement payload && payload.TryGetProperty("url", out var urlElement))
             {
                 string? payloadUrl = urlElement.GetString();
                 if (!string.IsNullOrEmpty(payloadUrl)) url = payloadUrl;
             }
             
             string? installPath = _configService.CurrentConfig.InstallPath;
             if (string.IsNullOrEmpty(installPath)) 
             {
                 SendToFrontend("error", new { message = "请先选择安装路径" });
                 return;
             }
             
             string dest = System.IO.Path.Combine(installPath, "WoW_Client.zip");
             _downloadService.StartDownload(url, dest);
        }

        private void DownloadService_ProgressChanged(object? sender, DownloadProgressInfo e)
        {
            Dispatcher.Invoke(() => 
            {
                string speedStr = FormatSpeed(e.SpeedBytesPerSecond);
                SendToFrontend("download_progress", new { 
                    progress = e.ProgressPercentage, 
                    speed = speedStr,
                    downloaded = e.BytesReceived,
                    total = e.TotalBytes
                });
            });
        }

        private async void DownloadService_DownloadCompleted(object? sender, bool success)
        {
            if (!success) return;

            string? installPath = _configService.CurrentConfig.InstallPath;
            if (string.IsNullOrEmpty(installPath)) return;

            // Check for zip
            string zipPath = System.IO.Path.Combine(installPath, "WoW_Client.zip");

            if (File.Exists(zipPath))
            {
                Dispatcher.Invoke(() => SendToFrontend("download_progress", new
                {
                    progress = 100,
                    speed = "解压中...",
                    downloaded = 0,
                    total = 0
                }));

                await Task.Run(() =>
                {
                    try
                    {
                        ZipFile.ExtractToDirectory(zipPath, installPath, true);
                        
                        FlattenGameDirectory(installPath);

                        Dispatcher.Invoke(() => SendToFrontend("download_progress", new
                        {
                            progress = 100,
                            speed = "正在清理...",
                            downloaded = 0,
                            total = 0
                        }));
                        
                        File.Delete(zipPath);
                    }
                    catch (Exception ex)
                    {
                        Dispatcher.Invoke(() => SendToFrontend("error", new { message = "解压失败: " + ex.Message }));
                    }
                });
            }

            Dispatcher.Invoke(() => 
            {
                SendToFrontend("download_complete");
                SendToFrontend("game_status", new { status = "ready", path = installPath });
            });
        }

        private void FlattenGameDirectory(string installPath)
        {
            try
            {
                // Check if Wow.exe already exists in the root
                if (File.Exists(System.IO.Path.Combine(installPath, "Wow.exe")))
                {
                    return;
                }

                // Look for subdirectories
                var subDirs = Directory.GetDirectories(installPath);
                foreach (var dir in subDirs)
                {
                    if (File.Exists(System.IO.Path.Combine(dir, "Wow.exe")))
                    {
                        // Found the game folder, move everything up
                        var dirInfo = new DirectoryInfo(dir);
                        
                        // Move files
                        foreach (var file in dirInfo.GetFiles())
                        {
                            string dest = System.IO.Path.Combine(installPath, file.Name);
                            if (!File.Exists(dest))
                            {
                                file.MoveTo(dest);
                            }
                        }

                        // Move directories
                        foreach (var subDir in dirInfo.GetDirectories())
                        {
                            string dest = System.IO.Path.Combine(installPath, subDir.Name);
                            if (!Directory.Exists(dest))
                            {
                                subDir.MoveTo(dest);
                            }
                        }

                        // Delete the now empty directory
                        Directory.Delete(dir, true);
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("目录结构修正失败: " + ex.Message);
            }
        }

        private void DownloadService_DownloadError(object? sender, string message)
        {
            Dispatcher.Invoke(() => 
            {
                SendToFrontend("download_error", new { message });
            });
        }

        private string FormatSpeed(double bytesPerSecond)
        {
            if (bytesPerSecond > 1024 * 1024)
                return $"{bytesPerSecond / (1024 * 1024):F1} MB/s";
            if (bytesPerSecond > 1024)
                return $"{bytesPerSecond / 1024:F1} KB/s";
            return $"{bytesPerSecond:F0} B/s";
        }

        private void SendToFrontend(string type, object? payload = null)
        {
            var msg = new IpcMessage { Type = type, Payload = payload };
            string json = JsonSerializer.Serialize(msg);
            webView.CoreWebView2.PostWebMessageAsJson(json);
        }

        // Win32 Interop
        [DllImport("user32.dll")]
        public static extern bool ReleaseCapture();

        [DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

        [DllImport("gdi32.dll")]
        public static extern IntPtr CreateRoundRectRgn(int nLeftRect, int nTopRect, int nRightRect, int nBottomRect, int nWidthEllipse, int nHeightEllipse);

        [DllImport("user32.dll")]
        public static extern int SetWindowRgn(IntPtr hWnd, IntPtr hRgn, bool bRedraw);

        public const int WM_NCLBUTTONDOWN = 0xA1;
        public const int HT_CAPTION = 0x2;
    }
}

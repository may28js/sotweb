using System;
using System.Collections.Generic;
using System.Linq;
using System.Diagnostics;
using System.Windows;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
using System.Windows.Input;
using Microsoft.Web.WebView2.Core;
using System.Runtime.InteropServices;
using System.Windows.Interop;
using System.Text.Json;
using System.Reflection;
using StoryOfTimeLauncher.Services;
using StoryOfTimeLauncher.Host.Services;
using StoryOfTimeLauncher.Models;
using StoryOfTimeLauncher.Host.Models;
using StoryOfTimeLauncher.Host.Logic;
using FolderBrowserDialog = System.Windows.Forms.FolderBrowserDialog;
using DialogResult = System.Windows.Forms.DialogResult;

namespace StoryOfTimeLauncher
{
    public partial class MainWindow : Window
    {
        private readonly ConfigService _configService;
        private readonly GameService _gameService;
        private readonly IDownloadService _downloadService;
        private readonly IGameScanner _gameScanner;
        private readonly IFileSanitizer _fileSanitizer;
        private readonly IPatcher _patcher;
        private readonly GameInspector _gameInspector; // The Officer
        private readonly System.Net.Http.HttpClient _httpClient;

        private ClientManifest? _cachedManifest;
        private double _displaySpeed = 0;
        private List<string> _discoveredClients = new List<string>();
        // private bool _isClientVerified = false; // Removed: Logic moved to Inspector
        private const string ManifestUrl = "https://shiguanggushi.xyz/patch/ClientManifest.json";
        private const string GameDownloadUrl = "https://btground.tk/chmi/ChromieCraft_3.3.5a.zip"; 
        private string _currentRealmlist = "38.55.125.89"; 
        private PauseToken _importPauseToken = new PauseToken(); 

        public MainWindow()
        {
            InitializeComponent();
            this.Title = "时光故事";
            _configService = new ConfigService();
            _gameService = new GameService();
            _gameScanner = new GameScanner();
            _fileSanitizer = new FileSanitizer();
            _patcher = new Patcher();
            _httpClient = new System.Net.Http.HttpClient();
            
            // Initialize the Officer
            _gameInspector = new GameInspector(_configService, _gameService, _fileSanitizer);

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
            IntPtr hRgn = CreateRoundRectRgn(0, 0, (int)this.ActualWidth + 1, (int)this.ActualHeight + 1, 16, 16);
            SetWindowRgn(new WindowInteropHelper(this).Handle, hRgn, true);
        }

        async void InitializeAsync()
        {
            try
            {
                // 1. Hide User Data Folder
                string appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string userDataFolder = System.IO.Path.Combine(appData, "StoryOfTimeLauncher", "Data");
                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder, new CoreWebView2EnvironmentOptions("--disable-web-security"));
                await webView.EnsureCoreWebView2Async(env);
                
                webView.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 26, 26, 26);
                webView.WebMessageReceived += WebView_WebMessageReceived;
                webView.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = true;

                // 2. Virtual Host for Embedded Resources
                webView.CoreWebView2.AddWebResourceRequestedFilter("https://storyoftime.local/*", CoreWebView2WebResourceContext.All);
                webView.CoreWebView2.WebResourceRequested += CoreWebView2_WebResourceRequested;

                // Inject diagnostics
                await webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(@"
                    window.addEventListener('error', function(e) {
                        window.chrome.webview.postMessage(JSON.stringify({ type: 'error', payload: 'JS Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno }));
                    });
                    window.addEventListener('unhandledrejection', function(e) {
                        window.chrome.webview.postMessage(JSON.stringify({ type: 'error', payload: 'Unhandled Promise: ' + e.reason }));
                    });
                ");

                webView.CoreWebView2.Navigate("https://storyoftime.local/index.html");
                
                // Start the State Machine
                // Active Handshake: Don't wait for app_ready, send status proactively after navigation
                await Task.Delay(500); // Wait for navigation to start
                
                // Phase 1: Determine Initial State
                await DetermineInitialStateAsync();
            }
            catch (Exception ex)
            {
                System.Windows.MessageBox.Show("Failed to initialize WebView2: " + ex.Message);
            }
        }

        private void CoreWebView2_WebResourceRequested(object? sender, CoreWebView2WebResourceRequestedEventArgs e)
        {
            // Parse the URL to get relative path
            var uri = new Uri(e.Request.Uri);
            string relativePath = uri.AbsolutePath.TrimStart('/').Replace('/', '.');
            
            // Map "index.html" or empty path to index.html
            if (string.IsNullOrEmpty(relativePath) || relativePath == "index.html")
            {
                relativePath = "index.html";
            }

            // Construct resource name: StoryOfTimeLauncher.wwwroot.<path>
            // Note: The namespace is StoryOfTimeLauncher.
            string resourceName = "StoryOfTimeLauncher.wwwroot." + relativePath;

            var assembly = Assembly.GetExecutingAssembly();
            var stream = assembly.GetManifestResourceStream(resourceName);

            if (stream == null)
            {
                 // Fallback: Try to find by suffix if exact match fails (handles potential naming quirks)
                 var allResources = assembly.GetManifestResourceNames();
                 var match = allResources.FirstOrDefault(r => r.EndsWith(relativePath, StringComparison.OrdinalIgnoreCase));
                 if (match != null)
                 {
                     stream = assembly.GetManifestResourceStream(match);
                 }
                 else 
                 {
                     Debug.WriteLine($"Resource not found: {resourceName}");
                     foreach(var name in allResources) Debug.WriteLine($"Available: {name}");
                 }
            }

            if (stream != null)
            {
                string mimeType = GetMimeType(relativePath);
                e.Response = webView.CoreWebView2.Environment.CreateWebResourceResponse(
                    stream, 
                    200, 
                    "OK", 
                    $"Content-Type: {mimeType}\nAccess-Control-Allow-Origin: *"
                );
            }
            else
            {
                // 404
                Debug.WriteLine($"Resource not found: {resourceName}");
                e.Response = webView.CoreWebView2.Environment.CreateWebResourceResponse(null, 404, "Not Found", "");
            }
        }

        private string GetMimeType(string filename)
        {
            string ext = System.IO.Path.GetExtension(filename).ToLower();
            return ext switch
            {
                ".html" => "text/html",
                ".js" => "application/javascript",
                ".css" => "text/css",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".avif" => "image/avif",
                ".svg" => "image/svg+xml",
                ".json" => "application/json",
                ".woff2" => "font/woff2",
                ".woff" => "font/woff",
                ".ico" => "image/x-icon",
                _ => "application/octet-stream"
            };
        }

        private async Task DetermineInitialStateAsync()
        {
            Console.WriteLine("[MainWindow] DetermineInitialStateAsync started.");
            // Default: Checking
            SetState(LauncherState.Checking, "正在检查游戏环境...");

            // Step 1: Check Config & Installation
            string installPath = _configService.CurrentConfig.InstallPath;
            
            // If path is not set, use default path: AppBase/Client
            if (string.IsNullOrEmpty(installPath))
            {
                installPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Client");
                Console.WriteLine($"[MainWindow] Config path empty. Using default: {installPath}");
            }
            else
            {
                Console.WriteLine($"[MainWindow] Configured path: {installPath}");
            }

            // Check for Import Marker
            bool hasImportMarker = File.Exists(System.IO.Path.Combine(installPath, GameService.ImportMarkerFile));

            // Check if executable exists (Fast Check)
            if (!hasImportMarker && _gameService.IsGameInstalled(installPath))
            {
                // Found valid game!
                // If config was empty or different, update it now
                if (_configService.CurrentConfig.InstallPath != installPath)
                {
                    _configService.CurrentConfig.InstallPath = installPath;
                    _configService.SaveConfig();
                }

                // Step 2: Check Updates (Deep Check)
                Console.WriteLine("[MainWindow] Client found. Verifying...");
                var report = await _gameInspector.VerifyClientAsync(installPath, (msg, p) => 
                {
                    Console.WriteLine($"[MainWindow] Verify Progress: {msg} ({p}%)");
                });
                
                if (report.Status == GameInspector.InspectionResult.RequiresUpdate || 
                    report.Status == GameInspector.InspectionResult.RequiresRepair)
                {
                    _pendingUpdateReport = report;
                    SetState(LauncherState.Update);
                }
                else if (report.Status == GameInspector.InspectionResult.ReadyToLaunch)
                {
                    SetState(LauncherState.Ready);
                }
                else
                {
                    SetState(LauncherState.Error, report.Message);
                }
            }
            else
            {
                // No client found in the target path (whether configured or default)
                Console.WriteLine("[MainWindow] No client found. Attempting auto-discovery...");
                
                _discoveredClients = await _gameScanner.AutoDiscoverClientsAsync();
                
                SetState(LauncherState.Install);

                // HACK: Wait for frontend to transition to Install view, then send discovery results
                // This prevents the message from being lost during component unmount/remount
                if (_discoveredClients.Any())
                {
                    Console.WriteLine($"[MainWindow] Discovered {_discoveredClients.Count} clients. Sending to frontend...");
                    await Task.Delay(500); 
                    SendToFrontend("discovered_clients", new { found = true, paths = _discoveredClients });
                }
                else
                {
                    Console.WriteLine("[MainWindow] Auto-discovery returned no results.");
                    SendToFrontend("discovered_clients", new { found = false });
                }
            }
        }

        private GameInspector.InspectionReport? _pendingUpdateReport;
        private LauncherStatus? _lastStatus;

        private void CoreWebView2_NavigationCompleted(object? sender, Microsoft.Web.WebView2.Core.CoreWebView2NavigationCompletedEventArgs e)
        {
            if (!e.IsSuccess)
            {
                System.Windows.MessageBox.Show($"Navigation failed: {e.WebErrorStatus}");
            }
        }

        private void WebView_WebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                string json = e.WebMessageAsJson;
                Console.WriteLine($"[IPC] Raw: {json}"); // Debug log

                // Parse as generic JSON first to handle various formats safely
                using (JsonDocument doc = JsonDocument.Parse(json))
                {
                    if (doc.RootElement.TryGetProperty("type", out JsonElement typeElement))
                    {
                        string? type = typeElement.GetString();
                        if (type == "drag")
                        {
                            ReleaseCapture();
                            SendMessage(new WindowInteropHelper(this).Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
                            return;
                        }
                    }
                }

                var message = JsonSerializer.Deserialize<IpcMessage>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (message == null) return;

                switch (message.Type)
                {
                    case "minimize":
                        this.WindowState = WindowState.Minimized;
                        break;
                    case "close":
                        this.Close();
                        break;
                    case "toggle_pause":
                        TogglePause();
                        break;
                    case "error":
                        System.Windows.MessageBox.Show($"Frontend Error: {message.Payload}");
                        break;
                    case "log":
                        Console.WriteLine($"[Frontend] {message.Payload}");
                        break;
                    case "app_ready":
                        Console.WriteLine("[IPC] Frontend ready. Resending state.");
                        if (_lastStatus != null)
                        {
                            SendToFrontend("state_update", _lastStatus);
                        }
                        if (_discoveredClients != null && _discoveredClients.Any())
                        {
                            // Delay slightly to ensure frontend components are fully mounted and listening
                            // This helps avoid race conditions where the listener isn't ready yet
                            Task.Run(async () => 
                            {
                                await Task.Delay(1000);
                                 System.Windows.Application.Current.Dispatcher.Invoke(() => 
                                 {
                                     Console.WriteLine($"[IPC] Resending {_discoveredClients.Count} discovered clients (Delayed).");
                                     SendToFrontend("discovered_clients", new { found = true, paths = _discoveredClients });
                                 });
                            });
                        }
                        break;
                    case "main_action":
                        OnMainButtonClick();
                        break;
                    case "import_game":
                        if (message.Payload is JsonElement payload && payload.TryGetProperty("path", out var pathProp))
                        {
                            string importPath = pathProp.GetString() ?? "";
                            if (!string.IsNullOrEmpty(importPath))
                            {
                                StartImport(importPath);
                            }
                        }
                        break;
                    // TODO: Re-implement game logic handlers
                }
            }
            catch (Exception) { /* Ignore */ }
        }

        private void TogglePause()
        {
            Console.WriteLine("[MainWindow] TogglePause requested.");
            
            // Check if Downloading
            if (_downloadService.IsDownloading || _downloadService.IsPaused)
            {
                if (_downloadService.IsPaused)
                {
                    Console.WriteLine("[MainWindow] Resuming download...");
                    _downloadService.ResumeDownload();
                }
                else
                {
                    Console.WriteLine("[MainWindow] Pausing download...");
                    _downloadService.PauseDownload();
                }
            }
            // Check if Importing (Approximation via state and message)
            else if (_currentState == LauncherState.Working) // Importing is also 'Working'
            {
                // Toggle Import Pause Token
                _importPauseToken.IsPaused = !_importPauseToken.IsPaused;
                Console.WriteLine($"[MainWindow] Toggled Import Pause: {_importPauseToken.IsPaused}");
            }
        }

        // --- Utility Methods ---

        private void SendToFrontend(string type, object? payload = null)
        {
            Console.WriteLine($"[IPC Send Start] Type: {type}");
            try 
            {
                if (webView == null || webView.CoreWebView2 == null)
                {
                    Console.WriteLine("[IPC Send Error] WebView2 is not ready.");
                    return;
                }

                // Manual JSON construction for simplicity and safety
                // We rely on standard serialization but without complex options
                var msg = new Dictionary<string, object?>
                {
                    { "type", type },
                    { "payload", payload }
                };

                string json = JsonSerializer.Serialize(msg);
                
                Console.WriteLine($"[IPC Send] {json}");
                webView.CoreWebView2.PostWebMessageAsJson(json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IPC Send Error] {ex.Message}\n{ex.StackTrace}");
            }
        }

        private void OnMainButtonClick()
        {
            switch (_currentState)
            {
                case LauncherState.Install:
                    StartInstall();
                    break;

                case LauncherState.Update:
                    StartUpdate();
                    break;

                case LauncherState.Ready:
                    StartGame();
                    break;
                
                case LauncherState.Error:
                    _ = DetermineInitialStateAsync();
                    break;

                case LauncherState.Checking:
                case LauncherState.Working:
                case LauncherState.Playing:
                    break;
            }
        }

        private async void StartInstall()
        {
            // For simplicity, we default to the 'client' folder in app directory
            // In a real scenario, we might want to ask user for path via FolderBrowserDialog
            // But let's stick to the "Action" paradigm. 
            // If path is not set, we use default path: AppBase/Client
            
            string installPath = _configService.CurrentConfig.InstallPath;
            if (string.IsNullOrEmpty(installPath))
            {
                // Logic: If no path, use default Client folder.
                installPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Client");
                _configService.CurrentConfig.InstallPath = installPath;
                _configService.SaveConfig();
            }

            // Start Download
            SetState(LauncherState.Working, "正在获取下载信息...", 0, "连接服务器...");
            
            string url = GameDownloadUrl; // Fallback
            
            try
            {
                if (_cachedManifest == null)
                {
                    // Add timestamp to prevent caching
                    string requestUrl = $"{ManifestUrl}?t={DateTime.Now.Ticks}";
                    Console.WriteLine($"[Install] Fetching manifest from: {requestUrl}");
                    
                    string json = await _httpClient.GetStringAsync(requestUrl);
                    _cachedManifest = JsonSerializer.Deserialize<ClientManifest>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }

                if (_cachedManifest != null && !string.IsNullOrEmpty(_cachedManifest.ClientDownloadUrl))
                {
                    url = _cachedManifest.ClientDownloadUrl;
                    Console.WriteLine($"[Install] Using dynamic URL: {url}");
                }
                else
                {
                    Console.WriteLine("[Install] Dynamic URL not found in manifest. Using default.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Install] Failed to fetch manifest: {ex.Message}. Using default URL.");
                // Continue with default URL, but maybe notify user in log
            }

            SetState(LauncherState.Working, "正在下载客户端...", 0, "准备下载...");

            string zipDest = System.IO.Path.Combine(installPath, "WoW_Client.zip");
            
            // Ensure directory exists
            if (!Directory.Exists(installPath)) Directory.CreateDirectory(installPath);

            _downloadService.StartDownload(url, zipDest);
        }

        private async void StartImport(string sourcePath)
        {
            if (string.IsNullOrEmpty(sourcePath) || !Directory.Exists(sourcePath))
            {
                SetState(LauncherState.Error, "导入路径无效");
                return;
            }

            // Select Target Path (Default to 'client' in app dir if not set, or ask user)
            string targetPath = _configService.CurrentConfig.InstallPath;
            if (string.IsNullOrEmpty(targetPath))
            {
                // If not set, use default path: AppBase/Client
                targetPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Client");
                _configService.CurrentConfig.InstallPath = targetPath;
                _configService.SaveConfig();
            }

            if (!Directory.Exists(targetPath))
            {
                Directory.CreateDirectory(targetPath);
            }

            // Create Import Marker
            string markerPath = System.IO.Path.Combine(targetPath, GameService.ImportMarkerFile);
            try { File.Create(markerPath).Close(); } catch { }

            SetState(LauncherState.Working, "准备导入...", 0, "读取清单...");

            // Load base_manifest.json from Embedded Resource
            ClientManifest? whitelistManifest = null;
            try 
            {
                var assembly = Assembly.GetExecutingAssembly();
                var resourceName = "StoryOfTimeLauncher.base_manifest.json";

                using (Stream? stream = assembly.GetManifestResourceStream(resourceName))
                {
                    if (stream != null)
                    {
                        using (StreamReader reader = new StreamReader(stream))
                        {
                            string json = await reader.ReadToEndAsync();
                            var localManifest = JsonSerializer.Deserialize<LocalManifest>(json);
                            
                            if (localManifest != null)
                            {
                                whitelistManifest = new ClientManifest
                                {
                                    Components = localManifest.Files.Select(f => new ClientFile 
                                    { 
                                        RelativePath = f.RelativePath, 
                                        Size = f.Size,
                                        Type = FileType.Core 
                                    }).ToList()
                                };
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[Import] Embedded resource '{resourceName}' not found. Available resources: {string.Join(", ", assembly.GetManifestResourceNames())}");
                        Console.WriteLine("[Import] base_manifest.json not found in resources. Importing all files (not recommended).");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Import] Failed to load manifest: {ex.Message}");
            }

            SetState(LauncherState.Working, "正在导入客户端...", 0, "开始复制...");
            
            _importPauseToken.IsPaused = false; // Reset pause state

            try
            {
                await _gameScanner.ImportClientAsync(sourcePath, targetPath, whitelistManifest, new Progress<TransferProgress>(p => 
                {
                    string speedStr = FormatSpeed(0); // TODO: Calculate speed if needed
                    SetState(LauncherState.Working, $"正在导入: {p.CurrentFileName}", p.Percentage, speedStr);
                }), _importPauseToken);

                // Remove Marker on Success
                try { if (File.Exists(markerPath)) File.Delete(markerPath); } catch { }

                // Re-verify after import
                Console.WriteLine("[StartImport] Import finished. Triggering re-verification...");
                await DetermineInitialStateAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[StartImport] Error: {ex.Message}");
                SetState(LauncherState.Error, "导入失败: " + ex.Message);
            }
        }

        private void StartUpdate()
        {
            if (_pendingUpdateReport == null || _pendingUpdateReport.PatchManifest == null)
            {
                // Should not happen if state is Update, but safety first
                SetState(LauncherState.Error, "更新信息丢失，请重试");
                return;
            }

            SetState(LauncherState.Working, "正在更新游戏...", 0, "准备中...");
            
            string path = _configService.CurrentConfig.InstallPath;
            
            _ = Task.Run(async () => 
            {
                try
                {
                    // Sliding Window for Speed Calculation
                    var samples = new Queue<(long Timestamp, long TotalBytes)>();
                    var stopwatch = Stopwatch.StartNew();
                    long lastUiUpdate = 0;
                    double currentDisplaySpeed = 0;

                    bool success = await _patcher.ApplyPatchesAsync(path, _pendingUpdateReport.PatchManifest, new Progress<PatchProgress>(p => 
                    {
                        double overall = p.TotalCount > 0 ? ((p.ProcessedCount + (p.CurrentFileProgress / 100.0)) / (double)p.TotalCount * 100) : 0;
                        string msg = $"正在更新: {p.CurrentFileName}";

                        long now = stopwatch.ElapsedMilliseconds;
                        samples.Enqueue((now, p.TotalBytesDownloaded));

                        // Prune samples older than 2000ms
                        while (samples.Count > 0 && samples.Peek().Timestamp < now - 2000)
                        {
                            samples.Dequeue();
                        }

                        if (now - lastUiUpdate > 100)
                        {
                            double realSpeed = 0;
                            if (samples.Count >= 2)
                            {
                                var oldest = samples.Peek();
                                long bytesInWindow = p.TotalBytesDownloaded - oldest.TotalBytes;
                                long duration = now - oldest.Timestamp;

                                if (duration > 0)
                                {
                                    realSpeed = bytesInWindow / (duration / 1000.0);
                                }
                            }

                            // Exponential Smoothing (Alpha = 0.25)
                            double alpha = 0.25;
                            currentDisplaySpeed = alpha * realSpeed + (1 - alpha) * currentDisplaySpeed;
                            
                            string speedStr = FormatSpeed(currentDisplaySpeed);
                            SetState(LauncherState.Working, msg, overall, speedStr);
                            lastUiUpdate = now;
                        }
                    }));

                    if (success)
                    {
                        // Re-verify
                        await this.Dispatcher.InvokeAsync(async () => await DetermineInitialStateAsync());
                    }
                    else
                    {
                        SetState(LauncherState.Error, "更新失败，请检查网络");
                    }
                }
                catch (Exception ex)
                {
                    SetState(LauncherState.Error, "更新异常: " + ex.Message);
                }
            });
        }

        private void StartGame()
        {
            // Direct to Playing state to avoid progress bar flash
            SetState(LauncherState.Playing, "正在启动...");
            
            string path = _configService.CurrentConfig.InstallPath;
            try
            {
                _gameService.UpdateRealmlist(path, _currentRealmlist);
                _gameService.LaunchGame(path);
                
                SetState(LauncherState.Playing, "游戏中...");
                
                // Optional: Restore to Ready after some time or minimize
                Task.Delay(3000).ContinueWith(_ => 
                {
                    this.Dispatcher.Invoke(() => SetState(LauncherState.Ready));
                });
            }
            catch (Exception ex)
            {
                SetState(LauncherState.Error, "启动失败: " + ex.Message);
            }
        }

        private void DownloadService_DownloadError(object? sender, string message)
        {
             Dispatcher.Invoke(() => SetState(LauncherState.Error, "下载失败: " + message));
        }

        private void SelectInstallPath()
        {
            using (var dialog = new System.Windows.Forms.FolderBrowserDialog())
            {
                dialog.Description = "请选择《魔兽世界》3.3.5a 安装目录";
                dialog.UseDescriptionForTitle = true;
                
                if (dialog.ShowDialog() == System.Windows.Forms.DialogResult.OK)
                {
                    string path = dialog.SelectedPath;
                    _configService.CurrentConfig.InstallPath = path;
                    _configService.SaveConfig();
                    
                    // Re-evaluate state immediately
                    _ = DetermineInitialStateAsync();
                }
            }
        }

        private string FormatSize(double bytes)
        {
            if (bytes > 1024 * 1024 * 1024)
                return $"{bytes / (1024 * 1024 * 1024):F1} GB";
            if (bytes > 1024 * 1024)
                return $"{bytes / (1024 * 1024):F1} MB";
            if (bytes > 1024)
                return $"{bytes / 1024:F1} KB";
            return $"{bytes:F0} B";
        }

        private string FormatSpeed(double bytesPerSecond)
        {
            return FormatSize(bytesPerSecond) + "/s";
        }

        private void FlattenGameDirectory(string installPath)
        {
            try
            {
                if (File.Exists(System.IO.Path.Combine(installPath, "Wow.exe"))) return;

                var subDirs = Directory.GetDirectories(installPath);
                foreach (var dir in subDirs)
                {
                    if (File.Exists(System.IO.Path.Combine(dir, "Wow.exe")))
                    {
                        var dirInfo = new DirectoryInfo(dir);
                        foreach (var file in dirInfo.GetFiles())
                        {
                            string dest = System.IO.Path.Combine(installPath, file.Name);
                            if (!File.Exists(dest)) file.MoveTo(dest);
                        }
                        foreach (var subDir in dirInfo.GetDirectories())
                        {
                            string dest = System.IO.Path.Combine(installPath, subDir.Name);
                            if (!Directory.Exists(dest)) subDir.MoveTo(dest);
                        }
                        Directory.Delete(dir, true);
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                Dispatcher.Invoke(() => System.Windows.MessageBox.Show("目录整理失败: " + ex.Message));
            }
        }
        private void DownloadService_ProgressChanged(object? sender, DownloadProgressInfo e)
        {
            Dispatcher.Invoke(() => 
            {
                // UI Exponential Smoothing
                double alpha = 0.25;
                _displaySpeed = alpha * e.SpeedBytesPerSecond + (1 - alpha) * _displaySpeed;

                // Calculate remaining time
                string timeStr = "计算中...";
                if (_displaySpeed > 0 && e.TotalBytes > 0)
                {
                    long remainingBytes = e.TotalBytes - e.BytesReceived;
                    if (remainingBytes > 0)
                    {
                        double seconds = remainingBytes / _displaySpeed;
                        if (seconds < 60) timeStr = $"{seconds:F0} 秒";
                        else if (seconds < 3600) timeStr = $"{seconds / 60:F0} 分钟";
                        else timeStr = $"{seconds / 3600:F1} 小时";
                    }
                    else
                    {
                        timeStr = "即将完成";
                    }
                }

                // Format: 273 KB/s - 46.2 MB，共 16.5 GB，还剩 18 小时
                string speedPart = FormatSpeed(_displaySpeed);
                string downloadedPart = FormatSize(e.BytesReceived);
                string totalPart = FormatSize(e.TotalBytes);
                
                string finalStr = $"{speedPart} - {downloadedPart}，共 {totalPart}，还剩 {timeStr}";
                
                SetState(LauncherState.Working, "正在下载游戏...", e.ProgressPercentage, finalStr);
            });
        }

        private async void DownloadService_DownloadCompleted(object? sender, bool success)
        {
            if (!success) return; // Error handled by DownloadError event

            string? installPath = _configService.CurrentConfig.InstallPath;
            if (string.IsNullOrEmpty(installPath)) return;

            string zipPath = System.IO.Path.Combine(installPath, "WoW_Client.zip");

            if (File.Exists(zipPath))
            {
                SetState(LauncherState.Working, "正在解压资源...", 100, "");

                await Task.Run(() =>
                {
                    try
                    {
                        ZipFile.ExtractToDirectory(zipPath, installPath, true);
                        FlattenGameDirectory(installPath);
                        File.Delete(zipPath);
                        
                        // Re-verify immediately to switch to Ready or Update
                        Dispatcher.Invoke(() => _ = DetermineInitialStateAsync());
                    }
                    catch (Exception ex)
                    {
                        Dispatcher.Invoke(() => SetState(LauncherState.Error, "解压失败: " + ex.Message));
                    }
                });
            }
        }
        
        // State Machine
        private LauncherState _currentState = LauncherState.Checking;

        private void SetState(LauncherState newState, string message = "", double progress = 0, string speed = "")
        {
            Console.WriteLine($"[MainWindow] SetState: {newState} ({message})");
            _currentState = newState;
            var status = new LauncherStatus 
            { 
                State = newState, 
                Message = message, 
                Progress = progress, 
                Speed = speed 
            };
            _lastStatus = status;
            
            this.Dispatcher.Invoke(() => SendToFrontend("state_update", status));
        }
        [DllImport("user32.dll")] public static extern bool ReleaseCapture();
        [DllImport("user32.dll")] public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        [DllImport("gdi32.dll")] public static extern IntPtr CreateRoundRectRgn(int nLeftRect, int nTopRect, int nRightRect, int nBottomRect, int nWidthEllipse, int nHeightEllipse);
        [DllImport("user32.dll")] public static extern int SetWindowRgn(IntPtr hWnd, IntPtr hRgn, bool bRedraw);
        public const int WM_NCLBUTTONDOWN = 0xA1;
        public const int HT_CAPTION = 0x2;
    }
}

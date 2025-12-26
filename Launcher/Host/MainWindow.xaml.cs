using System;
using System.Windows;
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

        public MainWindow()
        {
            InitializeComponent();
            _configService = new ConfigService();
            _gameService = new GameService();

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

                // Navigate to the frontend dev server
                webView.CoreWebView2.Navigate("http://localhost:5173");
                
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

        private void LaunchGame()
        {
            string? path = _configService.CurrentConfig.InstallPath;
            if (string.IsNullOrEmpty(path)) return;

            try
            {
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
                SendToFrontend("game_status", new { status = "not_installed", path = path });
            }
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

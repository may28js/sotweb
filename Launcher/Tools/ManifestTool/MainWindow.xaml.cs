using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using Microsoft.Win32;

namespace ManifestTool
{
    public partial class MainWindow : Window
    {
        private static readonly HashSet<string> IgnoredDirectories = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Interface", "WTF", "Screenshots", "Logs", "Errors", "Cache", 
            "Quarantine", "runtimes", ".git", ".vs", "Tools", "ManifestTool"
        };

        private static readonly HashSet<string> IgnoredFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "base_manifest.json", "patch_manifest.json", "ClientManifest.json",
            "StoryOfTimeLauncher.exe", "StoryOfTimeLauncher.dll", "StoryOfTimeLauncher.pdb", 
            "WebView2Loader.dll", "Launcher.exe", "ManifestGenerator.exe", "SotLauncher.exe",
            "ManifestTool.exe"
        };

        public MainWindow()
        {
            InitializeComponent();
        }

        private void BrowseButton_Click(object sender, RoutedEventArgs e)
        {
            var dialog = new OpenFolderDialog();
            if (dialog.ShowDialog() == true)
            {
                PathBox.Text = dialog.FolderName;
                Log($"选中路径: {dialog.FolderName}");
            }
        }

        private async void GenerateBase_Click(object sender, RoutedEventArgs e)
        {
            await GenerateManifestAsync(isPatch: false);
        }

        private async void GeneratePatch_Click(object sender, RoutedEventArgs e)
        {
            await GenerateManifestAsync(isPatch: true);
        }

        private async Task GenerateManifestAsync(bool isPatch)
        {
            string rootPath = PathBox.Text.Trim();
            if (string.IsNullOrEmpty(rootPath) || !Directory.Exists(rootPath))
            {
                MessageBox.Show("请先选择有效的游戏客户端路径。", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
                return;
            }

            Log("开始扫描...");
            ProgressBar.IsIndeterminate = true;
            
            try
            {
                var files = new List<FileInfo>();
                await Task.Run(() => ScanDirectory(rootPath, rootPath, files));

                Log($"扫描完成，共找到 {files.Count} 个文件。");

                if (isPatch)
                {
                    await CreatePatchManifest(rootPath, files);
                }
                else
                {
                    await CreateBaseManifest(rootPath, files);
                }

                MessageBox.Show("清单生成成功！", "完成", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                Log($"错误: {ex.Message}");
                MessageBox.Show($"生成失败: {ex.Message}", "错误", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                ProgressBar.IsIndeterminate = false;
            }
        }

        private void ScanDirectory(string rootPath, string currentPath, List<FileInfo> results)
        {
            var dirInfo = new DirectoryInfo(currentPath);

            // Check Ignore List
            if (IgnoredDirectories.Contains(dirInfo.Name)) return;

            foreach (var file in dirInfo.GetFiles())
            {
                if (IgnoredFiles.Contains(file.Name)) continue;
                if (file.Name.StartsWith(".")) continue;
                results.Add(file);
            }

            foreach (var dir in dirInfo.GetDirectories())
            {
                ScanDirectory(rootPath, dir.FullName, results);
            }
        }

        private async Task CreateBaseManifest(string rootPath, List<FileInfo> files)
        {
            var manifest = new BaseClientManifest();
            
            foreach (var file in files)
            {
                string relativePath = Path.GetRelativePath(rootPath, file.FullName).Replace("\\", "/");
                manifest.Files.Add(new BaseFileEntry
                {
                    RelativePath = relativePath,
                    Size = file.Length
                });
            }

            string json = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
            string outputPath = Path.Combine(rootPath, "base_manifest.json");
            await File.WriteAllTextAsync(outputPath, json);
            Log($"Base Manifest 已保存至: {outputPath}");
        }

        private async Task CreatePatchManifest(string rootPath, List<FileInfo> files)
        {
            int version = int.Parse(VersionBox.Text);
            string baseUrl = UrlBox.Text.Trim();
            if (!baseUrl.EndsWith("/")) baseUrl += "/";

            var manifest = new PatchManifest
            {
                Version = version,
                BaseUrl = baseUrl
            };

            bool computeMd5 = ComputeMd5Check.IsChecked == true;
            int current = 0;
            int total = files.Count;

            ProgressBar.IsIndeterminate = false;
            ProgressBar.Maximum = total;

            foreach (var file in files)
            {
                current++;
                ProgressBar.Value = current;
                
                string relativePath = Path.GetRelativePath(rootPath, file.FullName).Replace("\\", "/");
                Log($"[{current}/{total}] 处理: {relativePath}");

                string md5 = "";
                if (computeMd5)
                {
                    md5 = await ComputeMD5Async(file.FullName);
                }

                manifest.Patches.Add(new PatchEntry
                {
                    RelativePath = relativePath,
                    DownloadName = relativePath, // 默认保持一致，如果服务器是扁平结构，这里需要改
                    Size = file.Length,
                    MD5 = md5,
                    Action = "add"
                });
            }

            string json = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
            string outputPath = Path.Combine(rootPath, "patch_manifest.json");
            await File.WriteAllTextAsync(outputPath, json);
            Log($"Patch Manifest 已保存至: {outputPath}");
        }

        private async Task<string> ComputeMD5Async(string filePath)
        {
            return await Task.Run(() =>
            {
                using (var md5 = MD5.Create())
                using (var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    byte[] hashBytes = md5.ComputeHash(stream);
                    return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                }
            });
        }

        private void Log(string message)
        {
            Dispatcher.Invoke(() =>
            {
                LogBox.AppendText($"[{DateTime.Now:HH:mm:ss}] {message}\n");
                LogBox.ScrollToEnd();
            });
        }
    }
}

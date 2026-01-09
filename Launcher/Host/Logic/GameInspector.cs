using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Services;
using StoryOfTimeLauncher.Host.Services;
using StoryOfTimeLauncher.Models;
using StoryOfTimeLauncher.Host.Models;

namespace StoryOfTimeLauncher.Host.Logic
{
    public class GameInspector
    {
        private readonly ConfigService _configService;
        private readonly GameService _gameService;
        private readonly IFileSanitizer _fileSanitizer;
        private readonly System.Net.Http.HttpClient _httpClient;
        
        // New Manifest Caches
        private BaseClientManifest? _baseManifest;
        private PatchManifest? _patchManifest;

        private const string PatchManifestUrl = "https://shiguanggushi.xyz/patch/patch_manifest.json";

        public GameInspector(ConfigService configService, GameService gameService, IFileSanitizer fileSanitizer)
        {
            _configService = configService;
            _gameService = gameService;
            _fileSanitizer = fileSanitizer;
            _httpClient = new System.Net.Http.HttpClient { Timeout = TimeSpan.FromSeconds(30) };
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("StoryOfTimeLauncher/1.0");
        }

        public enum InspectionResult
        {
            ReadyToLaunch,
            NotInstalled,
            MissingExecutable,
            RequiresUpdate,
            RequiresRepair,
            NetworkError 
        }

        public class InspectionReport
        {
            public InspectionResult Status { get; set; }
            public string Message { get; set; } = string.Empty;
            public PatchManifest? PatchManifest { get; set; }
            public SanitizationReport? Sanitization { get; set; }
        }

        // Post 1 & 2: Fast Check (Synchronous)
        public InspectionReport QuickCheck(string installPath)
        {
            // Placeholder: Basic check only
            var report = new InspectionReport();
            if (string.IsNullOrEmpty(installPath) || !Directory.Exists(installPath))
            {
                report.Status = InspectionResult.NotInstalled;
                return report;
            }

            if (!_gameService.IsGameInstalled(installPath))
            {
                report.Status = InspectionResult.MissingExecutable;
                return report;
            }

            report.Status = InspectionResult.ReadyToLaunch;
            return report;
        }

        public async Task<InspectionReport> VerifyClientAsync(string installPath, Action<string, int>? progressCallback = null)
        {
            Console.WriteLine("[GameInspector] VerifyClientAsync started.");
            var report = new InspectionReport();
            
            // 1. Fetch Patch Manifest (Remote) with Timeout
            progressCallback?.Invoke("正在获取更新清单...", 0);
            
            if (_patchManifest == null)
            {
                try
                {
                    Console.WriteLine($"[GameInspector] Fetching manifest from {PatchManifestUrl}...");
                    // Use a cancellation token source for strict timeout
                    using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(30));
                    var response = await _httpClient.GetAsync(PatchManifestUrl, cts.Token);
                    
                    if (!response.IsSuccessStatusCode)
                    {
                        Console.WriteLine($"[GameInspector] Manifest fetch failed. Status: {response.StatusCode}");
                        report.Status = InspectionResult.NetworkError;
                        report.Message = $"无法获取更新清单 (HTTP {response.StatusCode})";
                        return report;
                    }

                    var json = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[GameInspector] Manifest fetched successfully. Length: {json.Length}");
                    
                    _patchManifest = System.Text.Json.JsonSerializer.Deserialize<PatchManifest>(json, 
                        new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        
                    if (_patchManifest != null)
                    {
                         Console.WriteLine($"[GameInspector] Parsed manifest. Patches count: {_patchManifest.Patches?.Count ?? 0}");
                    }
                    else
                    {
                         Console.WriteLine("[GameInspector] Parsed manifest is null.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[GameInspector] Manifest fetch failed: {ex.Message}");
                    System.Diagnostics.Debug.WriteLine($"Manifest fetch failed: {ex.Message}");
                    report.Status = InspectionResult.NetworkError;
                    report.Message = "无法连接更新服务器";
                    return report;
                }
            }
            report.PatchManifest = _patchManifest;

            // 2. Check Patches
            Console.WriteLine("[GameInspector] Checking patches...");
            progressCallback?.Invoke("校验更新补丁...", 50);
            if (_patchManifest != null)
            {
                var patchReport = await _fileSanitizer.CheckPatchesAsync(installPath, _patchManifest, new Progress<SanitizeProgress>(p => 
                {
                    int overall = 50 + (int)(p.Percentage * 0.5); 
                    progressCallback?.Invoke($"校验补丁: {p.CurrentFile}", overall);
                }));

                if (patchReport.MismatchedFiles.Count > 0)
                {
                    Console.WriteLine($"[GameInspector] Found {patchReport.MismatchedFiles.Count} mismatched files.");
                    report.Status = InspectionResult.RequiresUpdate;
                    report.Message = $"发现 {patchReport.MismatchedFiles.Count} 个更新";
                    report.Sanitization = patchReport; 
                    return report;
                }
            }

            // 3. Ready
            Console.WriteLine("[GameInspector] Client is ready.");
            report.Status = InspectionResult.ReadyToLaunch;
            report.Message = "就绪";
            progressCallback?.Invoke("就绪", 100);
            return report;
        }
    }
}

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Host.Models;
using StoryOfTimeLauncher.Host.Utils;
using StoryOfTimeLauncher.Models;

namespace StoryOfTimeLauncher.Host.Services
{
    public interface IFileSanitizer
    {
        // Now supports two-stage check
        Task<SanitizationReport> SanitizeBaseAsync(string installPath, BaseClientManifest baseManifest, IProgress<SanitizeProgress>? progress = null);
        Task<SanitizationReport> CheckPatchesAsync(string installPath, PatchManifest patchManifest, IProgress<SanitizeProgress>? progress = null);
    }

    public class FileSanitizer : IFileSanitizer
    {
        private readonly List<string> _ignoredFiles = new() { "StoryOfTimeLauncher.exe", "Sot Launcher.exe", "Sot Launcher.dll", "WebView2Loader.dll", "config.json", "base_manifest.json", "patch_state.json" };
        private readonly List<string> _ignoredDirectories = new() { "Cache", "Logs", "Screenshots", "WTF", "Interface" }; // Keep user data safe

        // 1. Base Check: Local Manifest, Name + Size Only
        public async Task<SanitizationReport> SanitizeBaseAsync(string installPath, BaseClientManifest baseManifest, IProgress<SanitizeProgress>? progress = null)
        {
            return await Task.Run(() =>
            {
                var report = new SanitizationReport();
                
                // Build Map for O(1)
                var manifestMap = baseManifest.Files
                    .GroupBy(f => f.RelativePath.Replace("\\", "/"), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

                // Scan Files
                var allFiles = Directory.GetFiles(installPath, "*", SearchOption.AllDirectories)
                    .Where(f => !_ignoredDirectories.Any(d => f.Contains(Path.DirectorySeparatorChar + d + Path.DirectorySeparatorChar)))
                    .ToList();

                int total = allFiles.Count;
                int current = 0;

                foreach (var filePath in allFiles)
                {
                    current++;
                    if (progress != null && current % 50 == 0) progress.Report(new SanitizeProgress { TotalCount = total, ProcessedCount = current, CurrentFile = Path.GetFileName(filePath) });

                    string relativePath = Path.GetRelativePath(installPath, filePath).Replace("\\", "/");
                    string fileName = Path.GetFileName(filePath);

                    if (_ignoredFiles.Contains(fileName)) continue;

                    if (manifestMap.TryGetValue(relativePath, out var entry))
                    {
                        // Known File: Check Size Only
                        var info = new FileInfo(filePath);
                        if (info.Length != entry.Size)
                        {
                            report.MismatchedFiles.Add(relativePath); // Needs reinstall/fix
                        }
                    }
                    else
                    {
                        // Unknown File: Ignore unless it's a core system file we want to clean
                        // For now, let's be safe and ignore unknown files (user addons etc)
                        // unless they are .mpq in Data
                        if (relativePath.EndsWith(".mpq", StringComparison.OrdinalIgnoreCase) && relativePath.StartsWith("Data"))
                        {
                            // Alien MPQ? Maybe delete?
                            // Let's NOT delete automatically for now, unless strict mode.
                        }
                    }
                }

                // Check Missing
                foreach (var entry in baseManifest.Files)
                {
                    string fullPath = Path.Combine(installPath, entry.RelativePath);
                    if (!File.Exists(fullPath))
                    {
                        report.MismatchedFiles.Add(entry.RelativePath); // Missing = Mismatched for logic
                    }
                }

                return report;
            });
        }

        // 2. Patch Check: Remote Manifest, Version/ID Based
        public async Task<SanitizationReport> CheckPatchesAsync(string installPath, PatchManifest patchManifest, IProgress<SanitizeProgress>? progress = null)
        {
            Console.WriteLine($"[FileSanitizer] Starting patch check. Total patches: {patchManifest.Patches?.Count ?? 0}");
            var report = new SanitizationReport();
            
            // Logic: Iterate Patch List -> Check if applied
            // We can store a local "patch_state.json" to track applied patches, 
            // OR just check file existence/hash for the few patches we have.
            // User suggested: "If missing -> Download -> Replace"
            
            if (patchManifest.Patches == null || patchManifest.Patches.Count == 0)
            {
                 Console.WriteLine("[FileSanitizer] No patches in manifest.");
                 return report;
            }

            int total = patchManifest.Patches.Count;
            int current = 0;

            foreach (var patch in patchManifest.Patches)
            {
                current++;
                if (progress != null) progress.Report(new SanitizeProgress { TotalCount = total, ProcessedCount = current, CurrentFile = patch.DownloadName });

                string fullPath = Path.Combine(installPath, patch.RelativePath);
                Console.WriteLine($"[FileSanitizer] Checking patch: {patch.RelativePath} (Action: {patch.Action})");

                if (patch.Action == "delete")
                {
                    if (File.Exists(fullPath)) 
                    {
                        Console.WriteLine($"[FileSanitizer] Mismatch: File exists but should be deleted: {fullPath}");
                        // Mark for action (Patcher will handle deletion?)
                        // Or delete here? Inspector shouldn't write... 
                        // But Sanitizer cleans... Let's add to report as "Mismatched" (needs action)
                         report.MismatchedFiles.Add(patch.RelativePath); 
                    }
                }
                else // add or replace
                {
                    if (!File.Exists(fullPath))
                    {
                        Console.WriteLine($"[FileSanitizer] Mismatch: File missing: {fullPath}");
                        report.MismatchedFiles.Add(patch.RelativePath);
                    }
                    else
                    {
                        // 1. Check Size First (Fastest)
                        var info = new FileInfo(fullPath);
                        if (info.Length != patch.Size)
                        {
                             Console.WriteLine($"[FileSanitizer] Mismatch: Size mismatch (Expected {patch.Size}, Actual {info.Length}): {fullPath}");
                             report.MismatchedFiles.Add(patch.RelativePath);
                             continue;
                        }

                        // 2. Check Partial Hash (Fast Fingerprint)
                        if (!string.IsNullOrEmpty(patch.Fingerprint))
                        {
                            if (!await PartialHashCalculator.VerifyFingerprintAsync(fullPath, patch.Fingerprint))
                            {
                                Console.WriteLine($"[FileSanitizer] Mismatch: Fingerprint mismatch: {fullPath}");
                                report.MismatchedFiles.Add(patch.RelativePath);
                                continue;
                            }
                        }
                    }
                }
            }

            Console.WriteLine($"[FileSanitizer] Check complete. Mismatched files: {report.MismatchedFiles.Count}");
            return report;
        }

        private async Task DeleteFileAsync(string path)
        {
            await Task.Run(() =>
            {
                try 
                {
                    if (File.Exists(path))
                    {
                        File.SetAttributes(path, FileAttributes.Normal);
                        File.Delete(path);
                    }
                }
                catch {}
            });
        }
        // Legacy Method Implementation (To fix build error)
        public Task<SanitizationReport> SanitizeAsync(string installPath, ClientManifest manifest, IProgress<SanitizeProgress>? progress = null)
        {
            throw new NotImplementedException("Use SanitizeBaseAsync or CheckPatchesAsync instead.");
        }
    }
}

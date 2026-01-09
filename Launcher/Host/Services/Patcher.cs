using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using StoryOfTimeLauncher.Host.Models;
using StoryOfTimeLauncher.Host.Utils;
using StoryOfTimeLauncher.Models;

using System.Net; // Added for HttpStatusCode
using System.Threading; // Added for Interlocked

namespace StoryOfTimeLauncher.Host.Services
{
    public class Patcher : IPatcher
    {
        private readonly HttpClient _httpClient;

        public Patcher()
        {
            _httpClient = new HttpClient();
            // 设置超时时间
            _httpClient.Timeout = System.Threading.Timeout.InfiniteTimeSpan; 
            // Default User Agent
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("StoryOfTimeLauncher/1.0");
        }

        // New Method Implementation
        public async Task<bool> ApplyPatchesAsync(string installPath, PatchManifest manifest, IProgress<PatchProgress> progress)
        {
            // 1. Identify what needs action
            var filesToProcess = new List<PatchEntry>();
            
            foreach (var patch in manifest.Patches)
            {
                string localPath = Path.Combine(installPath, patch.RelativePath);

                if (patch.Action == "delete")
                {
                    if (File.Exists(localPath)) filesToProcess.Add(patch);
                    continue;
                }

                // Add/Replace
                if (!File.Exists(localPath))
                {
                    filesToProcess.Add(patch);
                    continue;
                }

                // Exists: Check Size
                var info = new FileInfo(localPath);
                if (info.Length != patch.Size)
                {
                    filesToProcess.Add(patch);
                    continue;
                }

                // Size Match: Check Fingerprint
                if (!string.IsNullOrEmpty(patch.Fingerprint))
                {
                    if (!await PartialHashCalculator.VerifyFingerprintAsync(localPath, patch.Fingerprint))
                    {
                         filesToProcess.Add(patch);
                         continue;
                    }
                }
                // Fallback to MD5 if no fingerprint? 
                // Or just assume Size+Fingerprint is enough.
            }

            if (filesToProcess.Count == 0)
            {
                progress?.Report(new PatchProgress { TotalCount = 0, ProcessedCount = 0, CurrentFileProgress = 100 });
                return true;
            }

            // 2. Process
            int total = filesToProcess.Count;
            int completedCount = 0;
            long globalBytesDownloaded = 0;

            var parallelOptions = new ParallelOptions 
            { 
                MaxDegreeOfParallelism = 8 
            };

            try
            {
                await Parallel.ForEachAsync(filesToProcess, parallelOptions, async (patch, ct) =>
                {
                    string localPath = Path.Combine(installPath, patch.RelativePath);

                    if (patch.Action == "delete")
                    {
                        try { File.Delete(localPath); } catch { }
                        Interlocked.Increment(ref completedCount);
                        progress?.Report(new PatchProgress
                        {
                            TotalCount = total,
                            ProcessedCount = completedCount,
                            CurrentFileName = patch.DownloadName,
                            TotalBytesDownloaded = Interlocked.Read(ref globalBytesDownloaded),
                            CurrentFileProgress = 100
                        });
                        return;
                    }

                    string url = $"{manifest.BaseUrl.TrimEnd('/')}/{patch.RelativePath.Replace("\\", "/")}";
                    string dir = Path.GetDirectoryName(localPath);
                    if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);

                    long previousReportedBytes = 0;
                    var fileProgress = new Progress<long>(bytes =>
                    {
                        if (patch.Size > 0)
                        {
                            long delta = bytes - previousReportedBytes;
                            previousReportedBytes = bytes;
                            long currentGlobal = Interlocked.Add(ref globalBytesDownloaded, delta);

                            progress?.Report(new PatchProgress
                            {
                                TotalCount = total,
                                ProcessedCount = completedCount,
                                CurrentFileName = patch.DownloadName,
                                TotalBytesDownloaded = currentGlobal,
                                CurrentFileProgress = (double)bytes / patch.Size * 100
                            });
                        }
                    });

                    try
                    {
                        await DownloadFileAsync(url, localPath, patch.Size, fileProgress);
                    }
                    catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
                    {
                        string flatUrl = $"{manifest.BaseUrl.TrimEnd('/')}/{Path.GetFileName(patch.RelativePath)}";
                        Console.WriteLine($"[Patcher] 404 on {url}. Retrying with flat URL: {flatUrl}");
                        await DownloadFileAsync(flatUrl, localPath, patch.Size, fileProgress);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to patch {patch.RelativePath}: {ex.Message}");
                        throw; // Stop the parallel loop
                    }

                    Interlocked.Increment(ref completedCount);
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Patch process failed: {ex.Message}");
                return false;
            }

            return true;
        }

        // Old Method (Keeping to compile, but will remove logic to avoid confusion)
        public Task<bool> ApplyPatchAsync(string installPath, ClientManifest manifest, string downloadBaseUrl, IProgress<PatchProgress> progress)
        {
            throw new NotImplementedException("Use ApplyPatchesAsync instead.");
        }


        private async Task DownloadFileAsync(string url, string destinationPath, long expectedSize, IProgress<long> progress)
        {
            // Support Resume
            long existingLength = 0;
            if (File.Exists(destinationPath))
            {
                existingLength = new FileInfo(destinationPath).Length;
                if (existingLength >= expectedSize)
                {
                    // Already done? But MD5 check failed earlier?
                    // Let's assume we need to redownload if we are here
                    existingLength = 0; 
                    File.Delete(destinationPath);
                }
            }

            // Create request
            using (var request = new HttpRequestMessage(HttpMethod.Get, url))
            {
                if (existingLength > 0)
                {
                    request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(existingLength, null);
                }

                using (var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead))
                {
                    // Handle 416 Range Not Satisfiable (e.g. file changed on server)
                    if (response.StatusCode == System.Net.HttpStatusCode.RequestedRangeNotSatisfiable)
                    {
                        existingLength = 0;
                        // Retry without range
                        await DownloadFileAsync(url, destinationPath, expectedSize, progress); 
                        return;
                    }

                    response.EnsureSuccessStatusCode();

                    using (var contentStream = await response.Content.ReadAsStreamAsync())
                    using (var fileStream = new FileStream(destinationPath, existingLength > 0 ? FileMode.Append : FileMode.Create, FileAccess.Write, FileShare.None, 65536, true))
                    {
                        var buffer = new byte[65536];
                        long totalRead = existingLength;
                        int read;

                        while ((read = await contentStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                        {
                            await fileStream.WriteAsync(buffer, 0, read);
                            totalRead += read;
                            
                            // Throttle progress reporting (e.g. every 100KB or check time)
                            if (totalRead % 102400 < 8192 || totalRead == expectedSize) // Rough check every ~100KB
                            {
                                progress?.Report(totalRead);
                            }
                        }
                        // Ensure final report
                        progress?.Report(totalRead);
                    }
                }
            }
        }
    }
}

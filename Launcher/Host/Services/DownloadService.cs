using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Collections.Generic;
using System.Linq;
using System.Collections.Concurrent;
using System.Text.Json;

namespace StoryOfTimeLauncher.Services
{
    public class DownloadMeta
    {
        public string Url { get; set; } = "";
        public long TotalBytes { get; set; }
        public List<long> CompletedChunks { get; set; } = new();
    }

    public class DownloadService : IDownloadService
    {
        private readonly HttpClient _httpClient;
        private string? _currentUrl;
        private string? _currentDestination;
        private CancellationTokenSource? _cts;
        private long _totalBytes = -1;
        private long _downloadedBytes = 0;
        private DateTime _lastDataTime;
        
        // Parallel Download Support
        private const int MAX_CONCURRENCY = 4;
        private const long MIN_SIZE_FOR_PARALLEL = 32 * 1024 * 1024; // 32MB
        private const long CHUNK_SIZE = 16 * 1024 * 1024; // 16MB per dynamic chunk
        private ConcurrentDictionary<long, long> _chunkProgress = new();
        
        public event EventHandler<DownloadProgressInfo>? ProgressChanged;
        public event EventHandler<bool>? DownloadCompleted;
        public event EventHandler<string>? DownloadError;

        public bool IsDownloading { get; private set; }
        public bool IsPaused { get; private set; }
        
        // Strategy Marker
        public static string CurrentStrategy => "Strategy: ResumeSupport + ReuseHttpClient";

        public DownloadService()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = Timeout.InfiniteTimeSpan;
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            _httpClient.DefaultRequestHeaders.Accept.ParseAdd("*/*");
            _httpClient.DefaultRequestHeaders.AcceptEncoding.ParseAdd("identity");
            _httpClient.DefaultRequestHeaders.Connection.ParseAdd("keep-alive");
        }

        public void StartDownload(string url, string destinationPath)
        {
            if (IsDownloading && !IsPaused && _currentUrl == url && _currentDestination == destinationPath) return;

            _currentUrl = url;
            _currentDestination = destinationPath;
            _downloadedBytes = 0;
            _totalBytes = -1;
            IsPaused = false;

            var dir = Path.GetDirectoryName(destinationPath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            DownloadInternal();
        }

        public void PauseDownload()
        {
            if (!IsDownloading || IsPaused) return;
            
            _cts?.Cancel();
            IsDownloading = false;
            IsPaused = true;
        }

        public void ResumeDownload()
        {
            if (!IsPaused || string.IsNullOrEmpty(_currentUrl) || string.IsNullOrEmpty(_currentDestination)) return;
            
            IsPaused = false;
            DownloadInternal();
        }

        private async void DownloadInternal()
        {
            if (string.IsNullOrEmpty(_currentUrl) || string.IsNullOrEmpty(_currentDestination)) return;

            IsDownloading = true;
            _cts = new CancellationTokenSource();
            _lastDataTime = DateTime.Now;
            _ = MonitorSpeedAsync(_cts.Token);

            int retryCount = 0;
            const int MaxRetries = 50;

            // Use temporary file for download to prevent incomplete file issues
            string tempDestination = _currentDestination + ".downloading";

            while (true)
            {
                try
                {
                    // 1. Get Total Bytes (HEAD)
                    if (_totalBytes == -1)
                    {
                        try 
                        {
                            // Try to recover from meta if exists
                            string metaPath = _currentDestination + ".meta";
                            if (File.Exists(metaPath))
                            {
                                try
                                {
                                    var json = await File.ReadAllTextAsync(metaPath, _cts.Token);
                                    var meta = JsonSerializer.Deserialize<DownloadMeta>(json);
                                    if (meta != null && meta.Url == _currentUrl)
                                    {
                                        _totalBytes = meta.TotalBytes;
                                    }
                                }
                                catch { }
                            }

                            if (_totalBytes == -1)
                            {
                                using (var headRequest = new HttpRequestMessage(HttpMethod.Head, _currentUrl))
                                {
                                    var headResponse = await _httpClient.SendAsync(headRequest, HttpCompletionOption.ResponseHeadersRead, _cts.Token);
                                    if (headResponse.Content.Headers.ContentLength.HasValue)
                                    {
                                        _totalBytes = headResponse.Content.Headers.ContentLength.Value;
                                    }
                                }
                            }
                        }
                        catch { }
                    }

                    // 2. Decide Strategy
                    // Parallel if large enough AND not already finished (checked later)
                    bool useParallel = _totalBytes >= MIN_SIZE_FOR_PARALLEL;
                    
                    // Check if already downloaded (Final file exists)
                    if (File.Exists(_currentDestination))
                    {
                        var info = new FileInfo(_currentDestination);
                        if (_totalBytes != -1 && info.Length == _totalBytes)
                        {
                            _downloadedBytes = _totalBytes;
                            IsDownloading = false;
                            DownloadCompleted?.Invoke(this, true);
                            return;
                        }
                    }

                    if (useParallel)
                    {
                        // Check Range support
                        bool supportsRange = false;
                        try
                        {
                            using (var rangeCheck = new HttpRequestMessage(HttpMethod.Head, _currentUrl))
                            {
                                rangeCheck.Headers.Range = new RangeHeaderValue(0, 0);
                                var rangeResponse = await _httpClient.SendAsync(rangeCheck, HttpCompletionOption.ResponseHeadersRead, _cts.Token);
                                supportsRange = rangeResponse.StatusCode == System.Net.HttpStatusCode.PartialContent;
                            }
                        }
                        catch { }

                        if (supportsRange)
                        {
                            await DownloadParallelAsync(_cts.Token, tempDestination);
                            return;
                        }
                    }

                    // Fallback to Single Thread (Append Mode)
                    // For single thread, we can use simple append to .downloading
                    long existingLength = 0;
                    if (File.Exists(tempDestination))
                    {
                        existingLength = new FileInfo(tempDestination).Length;
                    }

                    if (_totalBytes != -1 && existingLength == _totalBytes)
                    {
                        // Download finished in temp, just rename
                        if (File.Exists(_currentDestination)) File.Delete(_currentDestination);
                        File.Move(tempDestination, _currentDestination);
                        IsDownloading = false;
                        DownloadCompleted?.Invoke(this, true);
                        return;
                    }
                    
                    if (existingLength > _totalBytes && _totalBytes != -1)
                    {
                        File.Delete(tempDestination);
                        existingLength = 0;
                    }

                    _downloadedBytes = existingLength;

                    var request = new HttpRequestMessage(HttpMethod.Get, _currentUrl);
                    if (_downloadedBytes > 0)
                    {
                        request.Headers.Range = new RangeHeaderValue(_downloadedBytes, null);
                    }

                    using (var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, _cts.Token))
                    {
                        response.EnsureSuccessStatusCode();
                        bool isPartial = response.StatusCode == System.Net.HttpStatusCode.PartialContent;

                        if (!isPartial && _downloadedBytes > 0)
                        {
                            // Server doesn't support range, reset
                            _downloadedBytes = 0;
                            existingLength = 0;
                        }
                        
                        // Update Total Bytes if needed
                        if (_totalBytes == -1)
                        {
                             if (response.Content.Headers.ContentRange != null && response.Content.Headers.ContentRange.Length.HasValue)
                                _totalBytes = response.Content.Headers.ContentRange.Length.Value;
                            else if (response.Content.Headers.ContentLength.HasValue)
                                _totalBytes = response.Content.Headers.ContentLength.Value + _downloadedBytes;
                        }

                        using (var contentStream = await response.Content.ReadAsStreamAsync(_cts.Token))
                        using (var fileStream = new FileStream(tempDestination, (!isPartial && existingLength == 0) ? FileMode.Create : FileMode.Append, FileAccess.Write, FileShare.None, 1024 * 1024, true))
                        {
                            var buffer = new byte[81920]; 
                            int bytesRead;
                            var stopwatch = Stopwatch.StartNew();
                            long lastReportTime = 0;
                            var samples = new Queue<(long Timestamp, int Bytes)>();

                            while ((bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length, _cts.Token)) > 0)
                            {
                                _lastDataTime = DateTime.Now;
                                await fileStream.WriteAsync(buffer, 0, bytesRead, _cts.Token);
                                _downloadedBytes += bytesRead;

                                // Speed calculation logic (reused)
                                long now = stopwatch.ElapsedMilliseconds;
                                samples.Enqueue((now, bytesRead));
                                while (samples.Count > 0 && samples.Peek().Timestamp < now - 2000) samples.Dequeue();

                                if (now - lastReportTime > 100)
                                {
                                    double speed = 0;
                                    if (samples.Count > 0)
                                    {
                                        long totalBytesInWindow = samples.Sum(s => (long)s.Bytes);
                                        long windowDuration = now - samples.Peek().Timestamp;
                                        if (windowDuration > 0) speed = totalBytesInWindow / (windowDuration / 1000.0);
                                    }
                                    
                                    double progress = _totalBytes > 0 ? (double)_downloadedBytes / _totalBytes * 100 : 0;
                                    ProgressChanged?.Invoke(this, new DownloadProgressInfo 
                                    { 
                                        ProgressPercentage = progress,
                                        BytesReceived = _downloadedBytes,
                                        TotalBytes = _totalBytes,
                                        SpeedBytesPerSecond = speed
                                    });
                                    lastReportTime = now;
                                }
                            }
                        }
                    }

                    // Rename on completion
                    if (File.Exists(_currentDestination)) File.Delete(_currentDestination);
                    File.Move(tempDestination, _currentDestination);

                    IsDownloading = false;
                    DownloadCompleted?.Invoke(this, true);
                    return;
                }
                catch (OperationCanceledException)
                {
                    IsDownloading = false;
                    return;
                }
                catch (Exception ex)
                {
                    if (_cts.IsCancellationRequested)
                    {
                        IsDownloading = false;
                        return;
                    }
                    retryCount++;
                    if (retryCount <= MaxRetries)
                    {
                        Debug.WriteLine($"Error: {ex.Message}. Retrying...");
                        try { await Task.Delay(2000, _cts.Token); } catch { IsDownloading = false; return; }
                        continue;
                    }
                    IsDownloading = false;
                    IsPaused = true;
                    DownloadError?.Invoke(this, ex.Message);
                    return;
                }
            }
        }

        private async Task DownloadParallelAsync(CancellationToken token, string tempDestination)
        {
            try
            {
                string metaPath = _currentDestination + ".meta";
                DownloadMeta meta = new DownloadMeta { Url = _currentUrl!, TotalBytes = _totalBytes };
                
                // Load Meta
                if (File.Exists(metaPath) && File.Exists(tempDestination))
                {
                    try
                    {
                        var json = await File.ReadAllTextAsync(metaPath, token);
                        var loaded = JsonSerializer.Deserialize<DownloadMeta>(json);
                        if (loaded != null && loaded.Url == _currentUrl && loaded.TotalBytes == _totalBytes)
                        {
                            meta = loaded;
                        }
                    }
                    catch { }
                }

                // Initialize File
                using (var fs = new FileStream(tempDestination, FileMode.OpenOrCreate, FileAccess.Write, FileShare.ReadWrite))
                {
                    if (fs.Length != _totalBytes)
                    {
                        fs.SetLength(_totalBytes);
                        // If file size changed, meta is invalid
                        meta.CompletedChunks.Clear();
                    }
                }

                _chunkProgress.Clear();
                // Restore progress from meta
                foreach (var chunkStart in meta.CompletedChunks)
                {
                    long size = Math.Min(CHUNK_SIZE, _totalBytes - chunkStart);
                    _chunkProgress.TryAdd(chunkStart, size);
                }
                
                var semaphore = new SemaphoreSlim(MAX_CONCURRENCY);
                var tasks = new List<Task>();
                
                long currentOffset = 0;
                var stopwatch = Stopwatch.StartNew();
                long lastReportTime = 0;
                var samples = new Queue<(long Timestamp, int Bytes)>();

                // Helper for progress and meta saving
                object metaLock = new object();
                DateTime lastMetaSave = DateTime.MinValue;

                void ReportProgress(int bytesRead, long chunkStart, bool chunkFinished)
                {
                    lock (samples)
                    {
                        long now = stopwatch.ElapsedMilliseconds;
                        samples.Enqueue((now, bytesRead));
                        while (samples.Count > 0 && samples.Peek().Timestamp < now - 2000) samples.Dequeue();

                        if (chunkFinished)
                        {
                             lock (metaLock)
                             {
                                 if (!meta.CompletedChunks.Contains(chunkStart))
                                 {
                                     meta.CompletedChunks.Add(chunkStart);
                                     // Save meta periodically or on chunk finish
                                     if ((DateTime.Now - lastMetaSave).TotalSeconds > 5)
                                     {
                                         try { File.WriteAllText(metaPath, JsonSerializer.Serialize(meta)); lastMetaSave = DateTime.Now; } catch { }
                                     }
                                 }
                             }
                        }

                        if (now - lastReportTime > 100)
                        {
                            long totalDownloaded = _chunkProgress.Values.Sum();
                            _downloadedBytes = totalDownloaded;

                            double speed = 0;
                            if (samples.Count > 0)
                            {
                                long totalBytesInWindow = samples.Sum(s => (long)s.Bytes);
                                long windowDuration = now - samples.Peek().Timestamp;
                                speed = windowDuration > 0 ? totalBytesInWindow / (windowDuration / 1000.0) : 0;
                            }

                            ProgressChanged?.Invoke(this, new DownloadProgressInfo
                            {
                                ProgressPercentage = (double)totalDownloaded / _totalBytes * 100,
                                BytesReceived = totalDownloaded,
                                TotalBytes = _totalBytes,
                                SpeedBytesPerSecond = speed
                            });
                            lastReportTime = now;
                        }
                    }
                }

                while (currentOffset < _totalBytes)
                {
                    long start = currentOffset;
                    long size = Math.Min(CHUNK_SIZE, _totalBytes - currentOffset);
                    long end = start + size - 1;
                    currentOffset += size;

                    // Skip if already downloaded
                    if (meta.CompletedChunks.Contains(start))
                    {
                        continue;
                    }

                    await semaphore.WaitAsync(token);

                    tasks.Add(Task.Run(async () =>
                    {
                        try
                        {
                            var request = new HttpRequestMessage(HttpMethod.Get, _currentUrl);
                            request.Headers.Range = new RangeHeaderValue(start, end);

                            using (var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, token))
                            {
                                response.EnsureSuccessStatusCode();

                                using (var contentStream = await response.Content.ReadAsStreamAsync(token))
                                using (var fs = new FileStream(tempDestination, FileMode.Open, FileAccess.Write, FileShare.ReadWrite, 1024 * 1024))
                                {
                                    fs.Position = start;
                                    var buffer = new byte[81920];
                                    int read;
                                    long chunkRead = 0;

                                    while ((read = await contentStream.ReadAsync(buffer, 0, buffer.Length, token)) > 0)
                                    {
                                        await fs.WriteAsync(buffer, 0, read, token);
                                        chunkRead += read;
                                        _chunkProgress.AddOrUpdate(start, chunkRead, (k, v) => chunkRead);
                                        _lastDataTime = DateTime.Now;
                                        ReportProgress(read, start, false);
                                    }
                                    
                                    // Chunk Completed
                                    if (chunkRead == size)
                                    {
                                        ReportProgress(0, start, true);
                                    }
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine($"Chunk failed: {ex.Message}");
                            throw;
                        }
                        finally
                        {
                            semaphore.Release();
                        }
                    }, token));
                }

                await Task.WhenAll(tasks);
                
                // Final Meta Save (Delete is handled in outer check)
                try { File.WriteAllText(metaPath, JsonSerializer.Serialize(meta)); } catch { }

                // Check completeness
                long totalDownloadedCheck = _chunkProgress.Values.Sum();
                if (totalDownloadedCheck == _totalBytes)
                {
                    if (File.Exists(_currentDestination)) File.Delete(_currentDestination);
                    File.Move(tempDestination, _currentDestination);
                    if (File.Exists(metaPath)) File.Delete(metaPath);
                    
                    IsDownloading = false;
                    DownloadCompleted?.Invoke(this, true);
                }
                else
                {
                    // Should not happen if all tasks succeeded
                    // Retry outer loop will handle it
                     throw new Exception($"Download incomplete: {totalDownloadedCheck}/{_totalBytes}");
                }
            }
            catch (Exception ex)
            {
                if (token.IsCancellationRequested)
                {
                    IsDownloading = false;
                    return;
                }
                throw; 
            }
        }
        
         private async Task MonitorSpeedAsync(CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested && IsDownloading)
                {
                    await Task.Delay(1000, token);
                    
                    if ((DateTime.Now - _lastDataTime).TotalSeconds > 2)
                    {
                        double progress = _totalBytes > 0 ? (double)_downloadedBytes / _totalBytes * 100 : 0;
                        
                        ProgressChanged?.Invoke(this, new DownloadProgressInfo 
                        { 
                            ProgressPercentage = progress,
                            BytesReceived = _downloadedBytes,
                            TotalBytes = _totalBytes,
                            SpeedBytesPerSecond = 0 
                        });
                    }
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                Debug.WriteLine($"[DownloadService] MonitorSpeedAsync error: {ex.Message}");
            }
        }
    }
}
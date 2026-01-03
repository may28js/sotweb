using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using System.Diagnostics;

namespace StoryOfTimeLauncher.Services
{
    public class DownloadService : IDownloadService
    {
        private readonly HttpClient _httpClient;
        private string? _currentUrl;
        private string? _currentDestination;
        private CancellationTokenSource? _cts;
        private long _totalBytes = -1;
        private long _downloadedBytes = 0;
        
        public event EventHandler<DownloadProgressInfo>? ProgressChanged;
        public event EventHandler<bool>? DownloadCompleted;
        public event EventHandler<string>? DownloadError;

        public bool IsDownloading { get; private set; }
        public bool IsPaused { get; private set; }

        public DownloadService()
        {
            _httpClient = new HttpClient();
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
            // Add User-Agent to avoid server throttling
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        }

        public void StartDownload(string url, string destinationPath)
        {
            if (IsDownloading && !IsPaused && _currentUrl == url && _currentDestination == destinationPath) return;

            _currentUrl = url;
            _currentDestination = destinationPath;
            _downloadedBytes = 0;
            _totalBytes = -1;
            IsPaused = false;

            if (File.Exists(destinationPath))
            {
                File.Delete(destinationPath);
            }

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

            try
            {
                if (_totalBytes == -1)
                {
                    try 
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
                    catch { }
                }

                var request = new HttpRequestMessage(HttpMethod.Get, _currentUrl);
                
                if (File.Exists(_currentDestination))
                {
                    _downloadedBytes = new FileInfo(_currentDestination).Length;
                }
                else
                {
                    _downloadedBytes = 0;
                }

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
                        _downloadedBytes = 0;
                        File.Delete(_currentDestination); 
                    }

                    if (_totalBytes == -1 && response.Content.Headers.ContentLength.HasValue)
                    {
                        _totalBytes = response.Content.Headers.ContentLength.Value + _downloadedBytes;
                    }

                    using (var contentStream = await response.Content.ReadAsStreamAsync(_cts.Token))
                    using (var fileStream = new FileStream(_currentDestination, isPartial ? FileMode.Append : FileMode.Create, FileAccess.Write, FileShare.None, 8192, true))
                    {
                        var buffer = new byte[81920]; // Increased buffer size to 80KB for better throughput
                        int bytesRead;
                        
                        long bytesSinceLastReport = 0;
                        var stopwatch = Stopwatch.StartNew();
                        long lastReportTime = 0;

                        while ((bytesRead = await contentStream.ReadAsync(buffer, 0, buffer.Length, _cts.Token)) > 0)
                        {
                            await fileStream.WriteAsync(buffer, 0, bytesRead, _cts.Token);
                            _downloadedBytes += bytesRead;
                            bytesSinceLastReport += bytesRead;

                            if (stopwatch.ElapsedMilliseconds - lastReportTime > 500)
                            {
                                double seconds = (stopwatch.ElapsedMilliseconds - lastReportTime) / 1000.0;
                                double speed = bytesSinceLastReport / seconds;
                                
                                double progress = _totalBytes > 0 ? (double)_downloadedBytes / _totalBytes * 100 : 0;

                                ProgressChanged?.Invoke(this, new DownloadProgressInfo 
                                { 
                                    ProgressPercentage = progress,
                                    BytesReceived = _downloadedBytes,
                                    TotalBytes = _totalBytes,
                                    SpeedBytesPerSecond = speed
                                });

                                bytesSinceLastReport = 0;
                                lastReportTime = stopwatch.ElapsedMilliseconds;
                            }
                        }
                    }
                }

                IsDownloading = false;
                DownloadCompleted?.Invoke(this, true);
            }
            catch (OperationCanceledException)
            {
                IsDownloading = false;
            }
            catch (Exception ex)
            {
                IsDownloading = false;
                IsPaused = true;
                DownloadError?.Invoke(this, ex.Message);
            }
        }
    }
}

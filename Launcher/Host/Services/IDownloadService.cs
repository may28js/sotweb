using System;

namespace StoryOfTimeLauncher.Services
{
    public class DownloadProgressInfo
    {
        public double ProgressPercentage { get; set; }
        public long BytesReceived { get; set; }
        public long TotalBytes { get; set; }
        public double SpeedBytesPerSecond { get; set; }
    }

    public interface IDownloadService
    {
        event EventHandler<DownloadProgressInfo> ProgressChanged;
        event EventHandler<bool> DownloadCompleted;
        event EventHandler<string> DownloadError;

        void StartDownload(string url, string destinationPath);
        void PauseDownload();
        void ResumeDownload();
        bool IsDownloading { get; }
        bool IsPaused { get; }
    }
}

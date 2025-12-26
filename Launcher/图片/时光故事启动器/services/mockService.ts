import { DownloadProgress } from '../types';

export const simulateDownloadTick = (currentProgress: DownloadProgress, isP2P: boolean = false): DownloadProgress => {
  // P2P is usually slower/more variable than HTTP in start, but can be fast
  let speed = 0;
  let peers = currentProgress.peers || 0;

  if (isP2P) {
      // Simulate peer discovery
      if (peers < 15 && Math.random() > 0.8) peers += 1;
      
      // Speed depends on peers
      const baseSpeed = peers * 0.5; // 0.5 MB/s per peer
      const fluctuation = Math.random() * 2;
      speed = baseSpeed + fluctuation;
  } else {
      // HTTP download (Patch) is stable and fast
      speed = Math.random() * 5 + 5; // 5-10 MB/s
  }

  const newDownloaded = Math.min(currentProgress.downloaded + speed, currentProgress.totalSize);
  
  return {
    ...currentProgress,
    downloaded: newDownloaded,
    speed: speed,
    percentage: (newDownloaded / currentProgress.totalSize) * 100,
    peers: peers
  };
};
import cliProgress from 'cli-progress';
import chalk from 'chalk';

export class DownloadProgress {
  private bar: cliProgress.SingleBar;
  private startTime: number;
  private totalBytes: number = 0;
  private downloadedBytes: number = 0;

  constructor() {
    this.startTime = Date.now();
    this.bar = new cliProgress.SingleBar({
      format: '[{bar}] {percentage}% | {speed} | ETA: {eta} | {downloaded}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      fps: 10,
      etaAsynchronous: true
    });
  }

  start(total: number): void {
    this.totalBytes = total;
    this.bar.start(total, 0, {
      speed: '0 B/s',
      downloaded: '0 MB'
    });
  }

  update(downloaded: number, total: number): void {
    this.downloadedBytes = downloaded;
    this.totalBytes = total || this.totalBytes;
    
    const speed = this.calculateSpeed();
    const eta = this.calculateETA();
    const downloadedMB = (this.downloadedBytes / (1024 * 1024)).toFixed(2);
    
    this.bar.update(this.downloadedBytes, {
      speed,
      downloaded: `${downloadedMB} MB`,
      eta
    });
  }

  private calculateSpeed(): string {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const bytesPerSecond = elapsed > 0 ? this.downloadedBytes / elapsed : 0;
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  private calculateETA(): string {
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (this.downloadedBytes === 0 || this.totalBytes === 0) return 'N/A';
    
    const speed = this.downloadedBytes / elapsed;
    const remaining = this.totalBytes - this.downloadedBytes;
    const seconds = remaining / speed;
    
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  stop(): void {
    this.bar.stop();
  }

  getTotalDownloaded(): number {
    return this.downloadedBytes;
  }
}
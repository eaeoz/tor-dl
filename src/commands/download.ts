import { displayError, displaySuccess, displayInfo } from '../cli/display';
import { getCachedResults } from '../download/engine';
import ora from 'ora';
import { exec } from 'child_process';
import chalk from 'chalk';

export async function downloadCommand(number: number, savePath?: string): Promise<void> {
  const results = getCachedResults();
  
  if (results.length === 0) {
    displayError('No search results found. Run "tor-dl search <query>" first.');
    process.exit(1);
  }
  
  if (number < 1 || number > results.length) {
    displayError(`Invalid selection. Choose a number between 1 and ${results.length}.`);
    process.exit(1);
  }
  
  const result = results[number - 1];
  
  displayInfo(`Downloading: ${result.name}`);
  displayInfo(`Source: ${result.source}`);
  displayInfo(`Size: ${result.size}`);
  displayInfo(`Seeds: ${result.seeds}\n`);
  
  const spinner = ora('Starting download...').start();
  
  try {
    const { downloadTorrent } = await import('../download/engine');
    await downloadTorrent(result, { savePath });
    spinner.succeed('Download complete!');
  } catch (error: any) {
    spinner.fail(`Download failed: ${error.message}`);
    displayError('Make sure you have a stable internet connection and sufficient disk space.');
    process.exit(1);
  }
}

export async function openInBrowser(number: number): Promise<void> {
  const results = getCachedResults();
  
  if (results.length === 0) {
    displayError('No search results found. Run "tor-dl search <query>" first.');
    process.exit(1);
  }
  
  if (number < 1 || number > results.length) {
    displayError(`Invalid selection. Choose a number between 1 and ${results.length}.`);
    process.exit(1);
  }
  
  const result = results[number - 1];
  
  if (!result.torrentUrl && !result.magnet) {
    displayError('No .torrent URL or magnet available for this result.');
    process.exit(1);
  }
  
  const url = result.torrentUrl || result.magnet || '';
  
  if (url.startsWith('magnet:')) {
    const { execSync } = require('child_process');
    try {
      if (process.platform === 'win32') {
        execSync(`echo ${url} | clip`, { stdio: 'ignore' });
      } else if (process.platform === 'darwin') {
        execSync(`echo "${url}" | pbcopy`, { stdio: 'ignore' });
      } else {
        execSync(`echo "${url}" | xclip -selection clipboard`, { stdio: 'ignore' });
      }
      displaySuccess('Magnet link copied to clipboard!');
      console.log(chalk.gray(url));
    } catch {
      displayInfo('Magnet link:');
      console.log(chalk.cyan(url));
    }
  } else {
    displayInfo('Opening: ' + url);
    const cmd = process.platform === 'win32' ? `start "" "${url}"` : 
                process.platform === 'darwin' ? `open "${url}"` : 
                `xdg-open "${url}"`;
    
    exec(cmd, (err) => {
      if (err) {
        const { execSync } = require('child_process');
        try {
          if (process.platform === 'win32') {
            execSync(`echo ${url} | clip`, { stdio: 'ignore' });
          } else if (process.platform === 'darwin') {
            execSync(`echo "${url}" | pbcopy`, { stdio: 'ignore' });
          } else {
            execSync(`echo "${url}" | xclip -selection clipboard`, { stdio: 'ignore' });
          }
          displaySuccess('URL copied to clipboard!');
        } catch {
          displayError('Failed to open. Copy this URL manually:');
          console.log(chalk.cyan(url));
        }
      } else {
        displaySuccess('Opened in browser');
      }
    });
  }
}
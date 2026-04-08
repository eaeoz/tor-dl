import { displayError, displaySuccess, displayInfo } from '../cli/display';
import { getCachedResults } from '../download/engine';
import ora from 'ora';

export async function downloadCommand(number: number, savePath?: string): Promise<void> {
  const results = getCachedResults();
  
  if (results.length === 0) {
    displayError('No search results found. Run "tordl search <query>" first.');
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
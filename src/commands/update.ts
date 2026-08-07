import axios from 'axios';
import { displaySuccess, displayError, displayInfo } from '../cli/display';
import { getUpdateUrl } from '../sources/registry';
import { saveJsonFile } from '../config';

export async function updateCommand(): Promise<void> {
  const updateUrl = getUpdateUrl();
  
  if (!updateUrl) {
    displayError('No update URL configured. Update sources.json with an updateUrl first.');
    return;
  }
  
  displayInfo(`Fetching latest sources from: ${updateUrl}`);
  
  try {
    const { data } = await axios.get(updateUrl, { timeout: 15000 });
    
    saveJsonFile('sources.json', data);
    
    displaySuccess('Sources updated successfully!');
    displayInfo(`Updated to version: ${data.version || 'unknown'}`);
    displayInfo(`Sources: ${Object.keys(data.sources || {}).join(', ')}`);
  } catch (error: any) {
    displayError(`Failed to update sources: ${error.message}`);
    displayInfo('Check your internet connection and the update URL.');
  }
}
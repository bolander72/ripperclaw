import { useState, useEffect } from 'react';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

interface UpdateState {
  available: boolean;
  version: string | null;
  downloading: boolean;
  downloadProgress: number;
  readyToInstall: boolean;
  error: string | null;
}

function getLastCheck(): number | null {
  const stored = localStorage.getItem('update-last-check');
  return stored ? parseInt(stored, 10) : null;
}

function setLastCheck(timestamp: number): void {
  localStorage.setItem('update-last-check', timestamp.toString());
}

function getCachedUpdate(): { available: boolean; version: string | null } | null {
  const stored = localStorage.getItem('update-cached');
  return stored ? JSON.parse(stored) : null;
}

function setCachedUpdate(info: { available: boolean; version: string | null }): void {
  localStorage.setItem('update-cached', JSON.stringify(info));
}

export function useUpdateCheck() {
  const [updateState, setUpdateState] = useState<UpdateState>({
    available: false,
    version: null,
    downloading: false,
    downloadProgress: 0,
    readyToInstall: false,
    error: null,
  });
  const [loading, setLoading] = useState(false);
  const [updateHandle, setUpdateHandle] = useState<Update | null>(null);

  const checkForUpdates = async () => {
    // Throttle: only check if last check was more than 1 hour ago
    const lastCheck = getLastCheck();
    const now = Date.now();
    
    if (lastCheck && now - lastCheck < CHECK_INTERVAL) {
      // Use cached result
      const cached = getCachedUpdate();
      if (cached && cached.available) {
        setUpdateState(prev => ({
          ...prev,
          available: true,
          version: cached.version,
        }));
      }
      return;
    }

    setLoading(true);
    
    try {
      const update = await check();
      
      if (update?.available) {
        const info = {
          available: true,
          version: update.version,
        };
        
        setUpdateState(prev => ({
          ...prev,
          available: true,
          version: update.version,
        }));
        setUpdateHandle(update);
        setCachedUpdate(info);
      } else {
        const info = { available: false, version: null };
        setUpdateState(prev => ({
          ...prev,
          available: false,
          version: null,
        }));
        setCachedUpdate(info);
      }
      
      setLastCheck(now);
    } catch (error) {
      // Silently fail on any error
      console.debug('Update check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadAndInstall = async () => {
    if (!updateHandle) {
      console.error('No update available to download');
      return;
    }

    setUpdateState(prev => ({
      ...prev,
      downloading: true,
      downloadProgress: 0,
      error: null,
    }));

    try {
      await updateHandle.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setUpdateState(prev => ({ ...prev, downloadProgress: 0 }));
            break;
          case 'Progress':
            if (event.data.contentLength) {
              const progress = (event.data.chunkLength / event.data.contentLength) * 100;
              setUpdateState(prev => ({ 
                ...prev, 
                downloadProgress: Math.min(progress, 100) 
              }));
            }
            break;
          case 'Finished':
            setUpdateState(prev => ({ 
              ...prev, 
              downloading: false,
              downloadProgress: 100,
              readyToInstall: true 
            }));
            break;
        }
      });
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        downloading: false,
        error: error instanceof Error ? error.message : 'Download failed',
      }));
      console.error('Update download failed:', error);
    }
  };

  const restartAndInstall = async () => {
    try {
      await relaunch();
    } catch (error) {
      console.error('Relaunch failed:', error);
      setUpdateState(prev => ({
        ...prev,
        error: 'Failed to restart app',
      }));
    }
  };

  useEffect(() => {
    checkForUpdates();
  }, []);

  return { 
    updateState, 
    loading, 
    checkForUpdates, 
    downloadAndInstall,
    restartAndInstall,
  };
}

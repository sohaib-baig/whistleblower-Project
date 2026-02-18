import type { SettingsState, SettingsProviderProps } from '../types';

import { isEqual } from 'es-toolkit';
import { useLocalStorage } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { getStorage as getStorageValue } from 'minimal-shared/utils';

import {
  updateThemeConfiguration,
  useGetThemeConfiguration,
} from 'src/actions/theme-configuration';

import { SettingsContext } from './settings-context';
import { SETTINGS_STORAGE_KEY } from '../settings-config';

// ----------------------------------------------------------------------

export function SettingsProvider({
  children,
  defaultSettings,
  storageKey = SETTINGS_STORAGE_KEY,
}: SettingsProviderProps) {
  const {
    state,
    setState: setStateLocal,
    resetState,
    setField: setFieldLocal,
  } = useLocalStorage<SettingsState>(storageKey, defaultSettings);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch theme configuration from API
  const { config: apiConfig, isLoading } = useGetThemeConfiguration();

  // Load settings from API on mount
  useEffect(() => {
    if (apiConfig && !isLoading) {
      const apiSettings: Partial<SettingsState> = {
        mode: apiConfig.mode ? 'dark' : 'light',
        contrast: apiConfig.contrast ? 'high' : 'default',
        direction: apiConfig.right_left ? 'rtl' : 'ltr',
        compactLayout: apiConfig.compact,
        primaryColor: apiConfig.color_setting as any,
        navLayout:
          apiConfig.navigation_type === 1
            ? 'vertical'
            : apiConfig.navigation_type === 2
              ? 'horizontal'
              : 'mini',
        navColor: apiConfig.navigation_color ? 'apparent' : 'integrate',
        fontFamily: apiConfig.typography || 'Public Sans',
        fontSize: parseInt(apiConfig.font_size, 10) || 16,
      };

      setStateLocal(apiSettings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiConfig, isLoading]);

  // Save to API when settings change
  const syncToApi = useCallback(
    async (newState: Partial<SettingsState>) => {
      if (isSyncing) return; // Prevent concurrent syncs

      setIsSyncing(true);
      try {
        // Prepare API data with proper type conversions
        const apiData: any = {};

        if (newState.mode !== undefined) {
          apiData.mode = newState.mode === 'dark';
        }
        if (newState.contrast !== undefined) {
          apiData.contrast = newState.contrast === 'high';
        }
        if (newState.direction !== undefined) {
          apiData.right_left = newState.direction === 'rtl';
        }
        if (newState.compactLayout !== undefined) {
          apiData.compact = Boolean(newState.compactLayout);
        }
        if (newState.primaryColor !== undefined) {
          apiData.color_setting = String(newState.primaryColor);
        }
        if (newState.navLayout !== undefined) {
          apiData.navigation_type =
            newState.navLayout === 'vertical' ? 1 : newState.navLayout === 'horizontal' ? 2 : 3;
        }
        if (newState.navColor !== undefined) {
          apiData.navigation_color = newState.navColor === 'apparent';
        }
        if (newState.fontFamily !== undefined) {
          apiData.typography = String(newState.fontFamily);
        }
        if (newState.fontSize !== undefined) {
          apiData.font_size = String(newState.fontSize);
        }

        await updateThemeConfiguration(apiData);
      } catch (error) {
        console.error('❌ Failed to save theme settings to API:', error);
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing]
  );

  const setState = useCallback(
    (updateValue: Partial<SettingsState>) => {
      setStateLocal(updateValue);
      syncToApi(updateValue);
    },
    [setStateLocal, syncToApi]
  );

  const setField = useCallback(
    (name: keyof SettingsState, updateValue: SettingsState[keyof SettingsState]) => {
      setFieldLocal(name, updateValue);
      syncToApi({ [name]: updateValue });
    },
    [setFieldLocal, syncToApi]
  );

  const onToggleDrawer = useCallback(() => {
    setOpenDrawer((prev) => !prev);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setOpenDrawer(false);
  }, []);

  const canReset = !isEqual(state, defaultSettings);

  const onReset = useCallback(() => {
    resetState(defaultSettings);
    syncToApi(defaultSettings);
  }, [defaultSettings, resetState, syncToApi]);

  // Version check and reset handling
  useEffect(() => {
    const storedValue = getStorageValue<SettingsState>(storageKey);

    if (storedValue) {
      try {
        if (!storedValue.version || storedValue.version !== defaultSettings.version) {
          onReset();
        }
      } catch {
        onReset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memoizedValue = useMemo(
    () => ({
      canReset,
      onReset,
      openDrawer,
      onCloseDrawer,
      onToggleDrawer,
      state,
      setState,
      setField,
    }),
    [canReset, onReset, openDrawer, onCloseDrawer, onToggleDrawer, state, setField, setState]
  );

  return <SettingsContext value={memoizedValue}>{children}</SettingsContext>;
}

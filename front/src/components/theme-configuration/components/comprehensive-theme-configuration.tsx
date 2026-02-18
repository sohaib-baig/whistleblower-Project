import { useEffect, useCallback } from 'react';
import { hasKeys } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { themeConfig } from 'src/theme/theme-config';
import { primaryColorPresets } from 'src/theme/with-settings';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import { settingIcons } from 'src/components/settings/drawer/icons';
import { BaseOption } from 'src/components/settings/drawer/base-option';
import { SmallBlock, LargeBlock } from 'src/components/settings/drawer/styles';
import { PresetsOptions } from 'src/components/settings/drawer/presets-options';
import { FontSizeOptions, FontFamilyOptions } from 'src/components/settings/drawer/font-options';
import {
  NavColorOptions,
  NavLayoutOptions,
} from 'src/components/settings/drawer/nav-layout-option';

// ----------------------------------------------------------------------

export function ComprehensiveThemeConfiguration() {
  const { t } = useTranslate('navbar');
  const settings = useSettingsContext();
  const { mode, setMode, colorScheme } = useColorScheme();

  // Default settings for visibility
  const defaultSettings = {
    mode: 'light' as const,
    contrast: 'default' as const,
    direction: 'ltr' as const,
    compactLayout: false,
    navLayout: 'vertical' as const,
    navColor: 'integrate' as const,
    fontFamily: 'Inter' as const,
    fontSize: 14,
    primaryColor: 'default' as const,
  };

  // Visible options by default settings
  const visibility = {
    mode: hasKeys(defaultSettings, ['mode']),
    contrast: hasKeys(defaultSettings, ['contrast']),
    direction: hasKeys(defaultSettings, ['direction']),
    navColor: hasKeys(defaultSettings, ['navColor']),
    fontSize: hasKeys(defaultSettings, ['fontSize']),
    navLayout: hasKeys(defaultSettings, ['navLayout']),
    fontFamily: hasKeys(defaultSettings, ['fontFamily']),
    primaryColor: hasKeys(defaultSettings, ['primaryColor']),
    compactLayout: hasKeys(defaultSettings, ['compactLayout']),
  };

  useEffect(() => {
    if (mode !== undefined && mode !== settings.state.mode) {
      settings.setState({ mode });
    }
  }, [mode, settings]);

  const handleReset = useCallback(() => {
    settings.onReset();
    setMode(null);
  }, [setMode, settings]);

  // Mode toggle
  const renderMode = () => (
    <BaseOption
      label={t('dashboard.themeConfiguration.basicSettings.mode')}
      selected={settings.state.mode === 'dark'}
      icon={<SvgIcon>{settingIcons.moon}</SvgIcon>}
      action={
        mode === 'system' ? (
          <Label
            sx={{
              height: 20,
              cursor: 'inherit',
              borderRadius: '20px',
              fontWeight: 'fontWeightSemiBold',
            }}
          >
            {t('dashboard.themeConfiguration.basicSettings.system')}
          </Label>
        ) : null
      }
      onChangeOption={() => {
        setMode(colorScheme === 'light' ? 'dark' : 'light');
        settings.setState({ mode: colorScheme === 'light' ? 'dark' : 'light' });
      }}
    />
  );

  // Contrast toggle
  const renderContrast = () => (
    <BaseOption
      label={t('dashboard.themeConfiguration.basicSettings.contrast')}
      selected={settings.state.contrast === 'high'}
      icon={<SvgIcon>{settingIcons.contrast}</SvgIcon>}
      onChangeOption={() => {
        settings.setState({
          contrast: settings.state.contrast === 'default' ? 'high' : 'default',
        });
      }}
    />
  );

  // Direction toggle
  const renderDirection = () => (
    <BaseOption
      label={t('dashboard.themeConfiguration.basicSettings.rightToLeft')}
      selected={settings.state.direction === 'rtl'}
      icon={<SvgIcon>{settingIcons.alignRight}</SvgIcon>}
      onChangeOption={() => {
        settings.setState({ direction: settings.state.direction === 'ltr' ? 'rtl' : 'ltr' });
      }}
    />
  );

  // Compact layout toggle
  const renderCompactLayout = () => (
    <BaseOption
      tooltip={t('dashboard.themeConfiguration.basicSettings.compactTooltip')}
      label={t('dashboard.themeConfiguration.basicSettings.compact')}
      selected={!!settings.state.compactLayout}
      icon={<SvgIcon>{settingIcons.autofitWidth}</SvgIcon>}
      onChangeOption={() => {
        settings.setState({ compactLayout: !settings.state.compactLayout });
      }}
    />
  );

  // Color presets
  const renderPresets = () => (
    <LargeBlock
      title={t('dashboard.themeConfiguration.colorSettings.colorPresets')}
      canReset={settings.state.primaryColor !== defaultSettings.primaryColor}
      onReset={() => {
        settings.setState({ primaryColor: defaultSettings.primaryColor });
      }}
    >
      <PresetsOptions
        icon={<SvgIcon sx={{ width: 28, height: 28 }}>{settingIcons.siderbarDuotone}</SvgIcon>}
        options={Object.keys(primaryColorPresets).map((key) => ({
          name: key as any,
          value: (primaryColorPresets as any)[key].main,
        }))}
        value={settings.state.primaryColor}
        onChangeOption={(newOption) => {
          settings.setState({ primaryColor: newOption });
        }}
      />
    </LargeBlock>
  );

  // Navigation settings
  const renderNav = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {visibility.navLayout && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            {t('dashboard.themeConfiguration.layoutSettings.navigationLayout.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 2 }}>
            {t('dashboard.themeConfiguration.layoutSettings.navigationLayout.description')}
          </Typography>
          <NavLayoutOptions
            value={settings.state.navLayout}
            onChangeOption={(newOption) => {
              settings.setState({ navLayout: newOption });
            }}
            options={[
              {
                value: 'vertical',
                icon: (
                  <SvgIcon sx={{ width: 1, height: '50px' }}>{settingIcons.navVertical}</SvgIcon>
                ),
              },
              {
                value: 'horizontal',
                icon: (
                  <SvgIcon sx={{ width: 1, height: '50px' }}>{settingIcons.navHorizontal}</SvgIcon>
                ),
              },
              {
                value: 'mini',
                icon: <SvgIcon sx={{ width: 1, height: '50px' }}>{settingIcons.navMini}</SvgIcon>,
              },
            ]}
          />
        </Box>
      )}

      {visibility.navColor && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, mt: 4 }}>
            {t('dashboard.themeConfiguration.layoutSettings.navigationColor.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('dashboard.themeConfiguration.layoutSettings.navigationColor.description')}
          </Typography>
          <NavColorOptions
            value={settings.state.navColor}
            onChangeOption={(newOption) => {
              settings.setState({ navColor: newOption });
            }}
            options={[
              {
                label: t('dashboard.themeConfiguration.layoutSettings.navigationColor.integrate'),
                value: 'integrate',
                icon: <SvgIcon>{settingIcons.sidebarOutline}</SvgIcon>,
              },
              {
                label: t('dashboard.themeConfiguration.layoutSettings.navigationColor.apparent'),
                value: 'apparent',
                icon: <SvgIcon>{settingIcons.sidebarFill}</SvgIcon>,
              },
            ]}
          />
        </Box>
      )}
    </Box>
  );

  // Font settings
  const renderFont = () => (
    <LargeBlock
      title={t('dashboard.themeConfiguration.typographySettings.typography')}
      sx={{ gap: 2.5 }}
    >
      {visibility.fontFamily && (
        <SmallBlock
          label={t('dashboard.themeConfiguration.typographySettings.family')}
          canReset={settings.state.fontFamily !== defaultSettings.fontFamily}
          onReset={() => {
            settings.setState({ fontFamily: defaultSettings.fontFamily });
          }}
        >
          <FontFamilyOptions
            value={settings.state.fontFamily}
            onChangeOption={(newOption) => {
              settings.setState({ fontFamily: newOption });
            }}
            options={[
              themeConfig.fontFamily.primary,
              'Inter Variable',
              'DM Sans Variable',
              'Nunito Sans Variable',
            ]}
            icon={<SvgIcon sx={{ width: 28, height: 28 }}>{settingIcons.font}</SvgIcon>}
          />
        </SmallBlock>
      )}
      {visibility.fontSize && (
        <SmallBlock
          label={t('dashboard.themeConfiguration.typographySettings.size')}
          canReset={settings.state.fontSize !== defaultSettings.fontSize}
          onReset={() => {
            settings.setState({ fontSize: defaultSettings.fontSize });
          }}
          sx={{ gap: 5 }}
        >
          <FontSizeOptions
            options={[12, 20]}
            value={settings.state.fontSize}
            onChangeOption={(newOption) => {
              settings.setState({ fontSize: newOption });
            }}
          />
        </SmallBlock>
      )}
    </LargeBlock>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          py: 2,
          pr: 1,
          pl: 2.5,
          display: 'flex',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {t('dashboard.themeConfiguration.heading')}
        </Typography>

        <Tooltip title={t('dashboard.themeConfiguration.resetAll')}>
          <IconButton onClick={handleReset}>
            <Badge color="error" variant="dot" invisible={!settings.canReset}>
              <Iconify icon="solar:restart-bold" />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Single Page Layout */}
      <Stack spacing={4}>
        {/* Basic Settings */}
        <Box>
          <Typography variant="h6" gutterBottom>
            {t('dashboard.themeConfiguration.basicSettings.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {t('dashboard.themeConfiguration.basicSettings.description')}
          </Typography>
          <Box sx={{ gap: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {visibility.mode && renderMode()}
            {visibility.contrast && renderContrast()}
            {visibility.direction && renderDirection()}
            {visibility.compactLayout && renderCompactLayout()}
          </Box>
        </Box>

        <Divider />

        {/* Color Settings */}
        {visibility.primaryColor && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.themeConfiguration.colorSettings.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {t('dashboard.themeConfiguration.colorSettings.description')}
            </Typography>
            {renderPresets()}
          </Box>
        )}

        <Divider />

        {/* Layout Settings */}
        {(visibility.navColor || visibility.navLayout) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.themeConfiguration.layoutSettings.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {t('dashboard.themeConfiguration.layoutSettings.description')}
            </Typography>
            {renderNav()}
          </Box>
        )}

        <Divider />

        {/* Typography Settings */}
        {(visibility.fontFamily || visibility.fontSize) && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.themeConfiguration.typographySettings.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {t('dashboard.themeConfiguration.typographySettings.description')}
            </Typography>
            {renderFont()}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

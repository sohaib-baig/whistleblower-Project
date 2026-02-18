import type { BoxProps } from '@mui/material/Box';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  backHref: string;
  editHref: string;
  liveHref: string;
  publish: string;
  onChangePublish: (newValue: string) => void;
  publishOptions: { value: string; label: string }[];
};

export function NewsDetailsToolbar({
  sx,
  publish,
  backHref,
  editHref,
  liveHref,
  publishOptions,
  onChangePublish,
  ...other
}: Props) {
  const { t } = useTranslate('navbar');
  const { user } = useAuthContext();
  const menuActions = usePopover();
  
  const isAdmin = user?.role === 'admin';

  const getStatusLabel = (status: string) => {
    if (status === 'published') return t('dashboard.news.status.published');
    if (status === 'draft') return t('dashboard.news.status.draft');
    return status;
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'top-right' } }}
    >
      <MenuList>
        {publishOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === publish}
            onClick={() => {
              menuActions.onClose();
              onChangePublish(option.value);
            }}
          >
            {option.value === 'published' && <Iconify icon="eva:cloud-upload-fill" />}
            {option.value === 'draft' && <Iconify icon="solar:file-text-bold" />}
            {getStatusLabel(option.value)}
          </MenuItem>
        ))}
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <Box
        sx={[
          { gap: 1.5, display: 'flex', mb: { xs: 3, md: 5 } },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        <Button
          component={RouterLink}
          href={backHref}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
        >
          {t('dashboard.news.toolbar.back')}
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        {publish === 'published' && (
          <Tooltip title={t('dashboard.news.toolbar.goLive')}>
            <IconButton component={RouterLink} href={liveHref}>
              <Iconify icon="eva:external-link-fill" />
            </IconButton>
          </Tooltip>
        )}

        {isAdmin && (
          <>
            <Tooltip title={t('dashboard.news.toolbar.edit')}>
              <IconButton component={RouterLink} href={editHref}>
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <Button
              color="inherit"
              variant="contained"
              loading={!publish}
              loadingIndicator={t('dashboard.news.toolbar.loading')}
              endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              onClick={menuActions.onOpen}
              sx={{ textTransform: 'capitalize' }}
            >
              {getStatusLabel(publish)}
            </Button>
          </>
        )}
      </Box>

      {renderMenuActions()}
    </>
  );
}

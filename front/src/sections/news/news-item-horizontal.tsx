import type { CardProps } from '@mui/material/Card';
import type { INewsItem } from 'src/types/news';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fShortenNumber } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = CardProps & {
  news: INewsItem;
  editHref: string;
  detailsHref: string;
  onDelete?: () => void;
  canManage?: boolean;
};

export function NewsItemHorizontal({
  sx,
  news,
  editHref,
  detailsHref,
  onDelete,
  canManage = true,
  ...other
}: Props) {
  const { t } = useTranslate('navbar');
  const menuActions = usePopover();

  const renderMenuActions = () => {
    if (!canManage) {
      return null;
    }

    return (
      <CustomPopover
        open={menuActions.open}
        anchorEl={menuActions.anchorEl}
        onClose={menuActions.onClose}
        slotProps={{ arrow: { placement: 'bottom-center' } }}
      >
        <MenuList>
          <li>
            <MenuItem
              component={RouterLink}
              href={detailsHref}
              onClick={() => menuActions.onClose()}
            >
              <Iconify icon="solar:eye-bold" />
              {t('dashboard.news.menu.view')}
            </MenuItem>
          </li>

          <li>
            <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
              <Iconify icon="solar:pen-bold" />
              {t('dashboard.news.menu.edit')}
            </MenuItem>
          </li>

          <MenuItem
            onClick={() => {
              menuActions.onClose();
              onDelete?.();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('dashboard.news.menu.delete')}
          </MenuItem>
        </MenuList>
      </CustomPopover>
    );
  };

  return (
    <>
      <Card sx={[{ display: 'flex' }, ...(Array.isArray(sx) ? sx : [sx])]} {...other}>
        <Stack
          spacing={1}
          sx={[
            (theme) => ({
              flexGrow: 1,
              p: theme.spacing(3, 3, 2, 3),
            }),
          ]}
        >
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Label variant="soft" color={(news.publish === 'published' && 'info') || 'default'}>
              {news.publish === 'published'
                ? t('dashboard.news.status.published')
                : news.publish === 'draft'
                  ? t('dashboard.news.status.draft')
                  : news.publish}
            </Label>

            <Box component="span" sx={{ typography: 'caption', color: 'text.disabled' }}>
              {fDate(news.createdAt)}
            </Box>
          </Box>

          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            <Link
              component={RouterLink}
              href={detailsHref}
              color="inherit"
              variant="subtitle2"
              sx={[
                (theme) => ({
                  ...theme.mixins.maxLine({ line: 2 }),
                }),
              ]}
            >
              {news.title}
            </Link>

            <Typography
              variant="body2"
              sx={[
                (theme) => ({
                  ...theme.mixins.maxLine({ line: 2 }),
                  color: 'text.secondary',
                }),
              ]}
            >
              {news.description}
            </Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {canManage && (
              <IconButton
                color={menuActions.open ? 'inherit' : 'default'}
                onClick={menuActions.onOpen}
              >
                <Iconify icon="eva:more-horizontal-fill" />
              </IconButton>
            )}

            <Box
              sx={{
                gap: 1.5,
                flexGrow: 1,
                display: 'flex',
                flexWrap: 'wrap',
                typography: 'caption',
                color: 'text.disabled',
                justifyContent: 'flex-end',
              }}
            >
              <Box sx={{ gap: 0.5, display: 'flex', alignItems: 'center' }}>
                <Iconify icon="solar:eye-bold" width={16} />
                {fShortenNumber(news.totalViews)}
              </Box>
            </Box>
          </Box>
        </Stack>

        <Box
          sx={{
            p: 1,
            width: 180,
            height: 240,
            flexShrink: 0,
            position: 'relative',
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <Avatar
            alt={news.author.name}
            src={news.author.avatarUrl}
            sx={{
              top: 16,
              right: 16,
              zIndex: 9,
              position: 'absolute',
            }}
          />
          <Image alt={news.title} src={news.coverUrl} sx={{ height: 1, borderRadius: 1.5 }} />
        </Box>
      </Card>

      {renderMenuActions()}
    </>
  );
}

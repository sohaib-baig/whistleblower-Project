import type { EmailTemplate } from 'src/types/email-template';

import { useState } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { convertEmailTemplate } from 'src/actions/email-template';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: EmailTemplate;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
  onConvertSuccess?: () => void;
};

// Supported languages for conversion (excluding English)
const SUPPORTED_LANGUAGES = ['sv', 'no', 'da', 'fi', 'de', 'fr'];

export function EmailTemplateTableRow({
  row,
  selected,
  editHref,
  onSelectRow,
  onDeleteRow,
  onConvertSuccess,
}: Props) {
  const { t } = useTranslate('navbar');
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const convertDialog = useBoolean();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  
  const isEnglish = row.language === 'en' || !row.language;

  const handleConvert = async () => {
    if (!selectedLanguage) {
      toast.error(t('dashboard.emailTemplate.convertDialog.errorInvalidLanguage'));
      return;
    }

    setIsConverting(true);
    try {
      await convertEmailTemplate(row.id, selectedLanguage);
      toast.success(t('dashboard.emailTemplate.convertDialog.success'));
      convertDialog.onFalse();
      setSelectedLanguage('');
      if (onConvertSuccess) {
        onConvertSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('dashboard.emailTemplate.convertDialog.error');
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        {isEnglish && (
          <MenuItem
            onClick={() => {
              convertDialog.onTrue();
              menuActions.onClose();
            }}
          >
            <Iconify icon="solar:global-bold" />
            {t('dashboard.emailTemplate.menuActions.convertToLanguage')}
          </MenuItem>
        )}
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:pen-bold" />
            {t('dashboard.emailTemplate.menuActions.edit')}
          </MenuItem>
        </li>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('dashboard.emailTemplate.menuActions.delete')}
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('dashboard.emailTemplate.confirmDialog.deleteTitle')}
      content={t('dashboard.emailTemplate.confirmDialog.deleteSingleContent')}
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          {t('dashboard.emailTemplate.menuActions.delete')}
        </Button>
      }
    />
  );

  const renderConvertDialog = () => (
    <Dialog
      open={convertDialog.value}
      onClose={isConverting ? undefined : convertDialog.onFalse}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('dashboard.emailTemplate.convertDialog.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Box sx={{ mb: 3, color: 'text.secondary' }}>
            {t('dashboard.emailTemplate.convertDialog.description')}
          </Box>
          <FormControl fullWidth>
            <InputLabel>{t('dashboard.emailTemplate.convertDialog.selectLanguage')}</InputLabel>
            <Select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              label={t('dashboard.emailTemplate.convertDialog.selectLanguage')}
              disabled={isConverting}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {t(`dashboard.emailTemplate.languageOptions.${lang}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={convertDialog.onFalse}
          disabled={isConverting}
        >
          {t('dashboard.emailTemplate.convertDialog.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={!selectedLanguage || isConverting}
          startIcon={isConverting ? <CircularProgress size={16} /> : <Iconify icon="solar:global-bold" />}
        >
          {isConverting
            ? t('dashboard.emailTemplate.convertDialog.converting')
            : t('dashboard.emailTemplate.convertDialog.convert')}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link component={RouterLink} href={editHref} color="inherit" sx={{ cursor: 'pointer' }}>
              {row.name}
            </Link>
            <Box component="span" sx={{ color: 'text.disabled' }}>
              {row.subject}
            </Box>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.subject}</TableCell>

        <TableCell>
          <Label variant="soft" color="info">
            {(() => {
              if (!row.language) return 'EN';
              const translationKey = `dashboard.emailTemplate.languageOptions.${row.language}`;
              const translated = t(translationKey);
              // If translation returns the key itself (meaning not found), fall back to uppercase
              return translated && translated !== translationKey
                ? translated
                : row.language.toUpperCase();
            })()}
          </Label>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'inactive' && 'warning') ||
              'default'
            }
          >
            {row.status === 'active'
              ? t('dashboard.emailTemplate.statusOptions.active')
              : row.status === 'inactive'
                ? t('dashboard.emailTemplate.statusOptions.inactive')
                : row.status}
          </Label>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row.createdAt)}</TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
      {renderConvertDialog()}
    </>
  );
}

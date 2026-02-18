import type { IInvoice } from 'src/types/invoice';

import { useRef, useState } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogActions from '@mui/material/DialogActions';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import sanctum from 'src/lib/axios-sanctum';
import { uploadInvoicePaymentAttachment } from 'src/actions/invoice';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { InvoicePDFViewer } from './invoice-pdf';

// ----------------------------------------------------------------------

type Props = {
  invoice?: IInvoice;
  currentStatus: string;
  statusOptions: { value: string; label: string }[];
  onChangeStatus: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

export function InvoiceToolbar({
  invoice,
  currentStatus,
  statusOptions,
  onChangeStatus,
  disabled,
}: Props) {
  const { t } = useTranslate('navbar');
  const { value: open, onFalse: onClose } = useBoolean();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isPending = currentStatus === 'pending';

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !invoice?.id) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or PDF.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      await uploadInvoicePaymentAttachment(invoice.id, file);
      toast.success('Payment receipt uploaded successfully');
      // Reload the page to show the updated invoice
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload payment receipt');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const renderDetailsDialog = () => (
    <Dialog fullScreen open={open}>
      <Box sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
        <DialogActions sx={{ p: 1.5 }}>
          <Button color="inherit" variant="contained" onClick={onClose}>
            {t('dashboard.invoice.close')}
          </Button>
        </DialogActions>
        <Box sx={{ flexGrow: 1, height: 1, overflow: 'hidden' }}>
          {invoice && <InvoicePDFViewer invoice={invoice} currentStatus={currentStatus} />}
        </Box>
      </Box>
    </Dialog>
  );

  return (
    <>
      <Box
        className="invoice-toolbar"
        sx={{
          gap: 3,
          display: 'flex',
          mb: { xs: 3, md: 5 },
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-end', sm: 'center' },
        }}
      >
        <Box
          sx={{
            gap: 1,
            width: 1,
            flexGrow: 1,
            display: 'flex',
          }}
        >
          {/* <Tooltip title="Edit">
            <IconButton
              component={RouterLink}
              href={paths.dashboard.invoice.edit(`${invoice?.id}`)}
            >
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip> */}

          {invoice?.paymentAttachment && (
            <Tooltip title={t('dashboard.invoice.viewPaymentAttachment')}>
              <IconButton
                onClick={() => {
                  if (!invoice.paymentAttachment) return;
                  const attachmentUrl = invoice.paymentAttachment.startsWith('http')
                    ? invoice.paymentAttachment
                    : `${CONFIG.serverUrl}${invoice.paymentAttachment}`;
                  window.open(attachmentUrl, '_blank');
                }}
              >
                <Iconify icon="solar:paperclip-bold" />
              </IconButton>
            </Tooltip>
          )}

          {/* <Tooltip title="View">
            <IconButton onClick={onOpen}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip> */}

          {/* {renderDownloadButton()} */}

          <Tooltip title={t('dashboard.invoice.download') || 'Download'}>
            <IconButton
              onClick={async () => {
                if (invoice?.id) {
                  try {
                    const response = await sanctum.get(`/api/v1/invoices/${invoice.id}/pdf`, {
                      responseType: 'blob',
                    });
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${invoice.invoiceNumber}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading PDF:', error);
                    // Fallback: open in new window
                    window.open(`${CONFIG.serverUrl}/api/v1/invoices/${invoice.id}/pdf`, '_blank');
                  }
                }
              }}
            >
              <Iconify icon="solar:download-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('dashboard.invoice.print')}>
            <IconButton
              onClick={() => {
                window.print();
              }}
            >
              <Iconify icon="solar:printer-minimalistic-bold" />
            </IconButton>
          </Tooltip>

          {isPending && (
            <Tooltip title="Upload Payment Receipt">
              <IconButton onClick={handleUploadClick} disabled={isUploading}>
                <Iconify icon="solar:upload-bold" />
              </IconButton>
            </Tooltip>
          )}

          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileChange}
          />

          {/* <Tooltip title="Send">
            <IconButton>
              <Iconify icon="custom:send-fill" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Share">
            <IconButton>
              <Iconify icon="solar:share-bold" />
            </IconButton>
          </Tooltip> */}
        </Box>

        {isAdmin && (
          <TextField
            fullWidth
            select
            label={t('dashboard.invoice.status')}
            value={currentStatus}
            onChange={onChangeStatus}
            disabled={!invoice?.id || disabled}
            sx={{ maxWidth: 160 }}
            slotProps={{
              htmlInput: { id: 'status-select' },
              inputLabel: { htmlFor: 'status-select' },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {renderDetailsDialog()}
    </>
  );
}

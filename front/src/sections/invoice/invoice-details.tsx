import type { IInvoice } from 'src/types/invoice';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { CONFIG } from 'src/global-config';
import sanctum from 'src/lib/axios-sanctum';
import { INVOICE_STATUS_OPTIONS } from 'src/_mock';
import { useTranslate } from 'src/locales/use-locales';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';

import { InvoiceToolbar } from './invoice-toolbar';
import { InvoiceTotalSummary } from './invoice-total-summary';

// ----------------------------------------------------------------------

type Props = {
  invoice?: IInvoice;
};

export function InvoiceDetails({ invoice }: Props) {
  const { t } = useTranslate('navbar');
  const [currentStatus, setCurrentStatus] = useState(invoice?.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleChangeStatus = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newStatus = event.target.value;

      if (!invoice?.id) {
        toast.error('Invoice ID is missing');
        return;
      }

      // Optimistically update UI
      setCurrentStatus(newStatus);
      setIsUpdatingStatus(true);

      try {
        await sanctum.put(`/api/v1/invoices/${invoice.id}/status`, {
          status: newStatus,
        });

        toast.success('Invoice status updated successfully');
      } catch (error: any) {
        // Revert on error
        setCurrentStatus(invoice?.status);
        toast.error(error?.message || 'Failed to update invoice status');
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [invoice]
  );

  const renderFooter = () => (
    <Box
      sx={{
        py: 3,
        gap: 2,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div>
        {invoice?.invoiceNote && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('dashboard.invoice.details.notes')}
            </Typography>
            <Typography 
              variant="body2"
              sx={{ whiteSpace: 'pre-line' }}
            >
              {invoice.invoiceNote}
            </Typography>
          </>
        )}
        {!invoice?.invoiceNote && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('dashboard.invoice.details.notes')}
            </Typography>
            <Typography variant="body2">
              We appreciate your business.
            </Typography>
          </>
        )}
          {invoice?.bankDetails && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {t('dashboard.invoice.details.bankDetails')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {invoice.bankDetails.iban && (
                <>
                  <strong>{t('dashboard.invoice.details.iban')}:</strong> {invoice.bankDetails.iban}
                  <br />
                </>
              )}
              {invoice.bankDetails.bic_code && (
                <>
                  <strong>{t('dashboard.invoice.details.bicSwift')}:</strong> {invoice.bankDetails.bic_code}
                  <br />
                </>
              )}
              {invoice.bankDetails.bank_account && (
                <>
                  <strong>{t('dashboard.invoice.details.bankgiro')}:</strong> {invoice.bankDetails.bank_account}
                </>
              )}
            </Typography>
          </Box>
        )}
      </div>

      <Box sx={{ flexGrow: { md: 1 }, textAlign: { md: 'right' } }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {t('dashboard.invoice.details.haveQuestion')}
        </Typography>
        <Typography variant="body2">{invoice?.adminEmail || 'support@minimals.cc'}</Typography>
      </Box>
    </Box>
  );

  const renderList = () => (
    <Scrollbar sx={{ mt: 5 }}>
      <Table sx={{ minWidth: 960 }}>
        <TableHead>
          <TableRow>
            <TableCell width={40}>#</TableCell>
            <TableCell sx={{ typography: 'subtitle2' }}>{t('dashboard.invoice.details.description')}</TableCell>
            <TableCell>{t('dashboard.invoice.details.qty')}</TableCell>
            <TableCell align="right">{t('dashboard.invoice.details.unitPrice')}</TableCell>
            <TableCell align="right">{t('dashboard.invoice.details.total')}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {invoice?.items.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>

              <TableCell>
                <Box sx={{ maxWidth: 560 }}>
                  <Typography variant="subtitle2">{row.title}</Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                    {row.description}
                  </Typography>
                </Box>
              </TableCell>

              <TableCell>{row.quantity}</TableCell>
              <TableCell align="right">{fCurrency(row.price)}</TableCell>
              <TableCell align="right">{fCurrency(row.price * row.quantity)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Scrollbar>
  );

  return (
    <>
      <InvoiceToolbar
        invoice={invoice}
        currentStatus={currentStatus || ''}
        onChangeStatus={handleChangeStatus}
        statusOptions={INVOICE_STATUS_OPTIONS}
        disabled={isUpdatingStatus}
      />

      <Card sx={{ pt: 5, px: 5 }}>
        <Box
          sx={{
            rowGap: 5,
            display: 'grid',
            alignItems: 'center',
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
          }}
        >
          <Box
            component="img"
            alt="Invoice logo"
            src={(() => {
              if (!invoice?.logo) {
                return '/logo/logo-single.svg';
              }
              const logoUrl = invoice.logo.startsWith('http')
                ? invoice.logo
                : `${CONFIG.serverUrl}${invoice.logo}`;
              return logoUrl;
            })()}
            sx={{ width: 125, height: 'auto' }}
            onError={(e) => {
              console.error('❌ Invoice logo failed to load:', e.currentTarget.src);
              // Fallback to default logo if image fails to load
              e.currentTarget.src = '/logo/logo-single.svg';
            }}
          />

          <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Label
              variant="soft"
              color={
                (currentStatus === 'paid' && 'success') ||
                (currentStatus === 'pending' && 'warning') ||
                'default'
              }
            >
              {currentStatus}
            </Label>

            <Typography variant="h6">{invoice?.invoiceNumber}</Typography>
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('dashboard.invoice.details.invoiceFrom')}
            </Typography>
            {invoice?.invoiceFrom.company && (
              <>
                {invoice.invoiceFrom.company}
                <br />
              </>
            )}
            {invoice?.invoiceFrom.companyNumber && (
              <>
                {t('dashboard.invoice.details.companyNumber')}: {invoice.invoiceFrom.companyNumber}
                <br />
              </>
            )}
            {invoice?.invoiceFrom.fullAddress}
            {invoice?.invoiceFrom.city && (
              <>
                <br />
                {invoice.invoiceFrom.city}
                {invoice.invoiceFrom.zip_code && `, ${invoice.invoiceFrom.zip_code}`}
              </>
            )}
            {invoice?.invoiceFrom.country && (
              <>
                <br />
                {invoice.invoiceFrom.country}
              </>
            )}
            <br />
            {t('dashboard.invoice.details.phone')}: {invoice?.invoiceFrom.phoneNumber}
            <br />
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('dashboard.invoice.details.invoiceTo')}
            </Typography>
            {invoice?.invoiceTo.name}
            <br />
            {invoice?.invoiceTo.company && (
              <>
                {invoice.invoiceTo.company}
                <br />
              </>
            )}
            {invoice?.invoiceTo.companyNumber && (
              <>
                {t('dashboard.invoice.details.companyNumber')}: {invoice.invoiceTo.companyNumber}
                <br />
              </>
            )}
            {invoice?.invoiceTo.fullAddress}
            {invoice?.invoiceTo.city && (
              <>
                <br />
                {invoice.invoiceTo.city}
                {invoice.invoiceTo.zip_code && `, ${invoice.invoiceTo.zip_code}`}
              </>
            )}
            {invoice?.invoiceTo.country && (
              <>
                <br />
                {invoice.invoiceTo.country}
              </>
            )}
            <br />
            {t('dashboard.invoice.details.phone')}: {invoice?.invoiceTo.phoneNumber}
            <br />
          </Stack>

          <Stack sx={{ typography: 'body2' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('dashboard.invoice.details.dateCreate')}
            </Typography>
            {fDate(invoice?.createDate)}
          </Stack>

          {invoice?.status !== 'paid' && (
            <Stack sx={{ typography: 'body2' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('dashboard.invoice.details.dueDate')}
              </Typography>
              {fDate(invoice?.dueDate)}
            </Stack>
          )}
        </Box>

        {renderList()}

        <Divider sx={{ borderStyle: 'dashed' }} />

        <InvoiceTotalSummary
          taxes={invoice?.taxes}
          subtotal={invoice?.subtotal}
          totalAmount={invoice?.totalAmount}
        />

        <Divider sx={{ mt: 5, borderStyle: 'dashed' }} />

        {renderFooter()}
      </Card>
    </>
  );
}

import type { TableHeadCellProps } from 'src/components/table';
import type { IInvoice, IInvoiceTableFilters } from 'src/types/invoice';

import { sumBy } from 'es-toolkit';
import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fIsAfter } from 'src/utils/format-time';

import { useTranslate } from 'src/locales';
import { INVOICE_SERVICE_OPTIONS } from 'src/_mock';
import { fetchInvoices } from 'src/actions/invoice';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { InvoiceAnalytic } from '../invoice-analytic';
import { InvoiceTableRow } from '../invoice-table-row';
import { InvoiceTableToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFiltersResult } from '../invoice-table-filters-result';

// ----------------------------------------------------------------------

export function InvoiceListView() {
  const { t } = useTranslate('navbar');
  const theme = useTheme();
  const { user } = useAuthContext();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'invoiceNumber', label: t('dashboard.invoice.tableHeaders.customer'), width: 220 },
    { id: 'createDate', label: t('dashboard.invoice.tableHeaders.create'), width: 150 },
    { id: 'dueDate', label: t('dashboard.invoice.tableHeaders.due'), width: 150 },
    { id: 'price', label: t('dashboard.invoice.tableHeaders.amount'), width: 120 },
    { id: 'sent', label: t('dashboard.invoice.tableHeaders.sent'), width: 100, align: 'center' },
    { id: 'status', label: t('dashboard.invoice.tableHeaders.status'), width: 120 },
    { id: '', width: 88 },
  ];

  // Check if user can manage invoices (admin only)
  const userRole = user?.role?.toLowerCase();
  const canManageInvoices = userRole === 'admin';

  const table = useTable({ defaultOrderBy: 'created_at', defaultOrder: 'desc' });

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
  });

  // Define filters before useEffect to avoid initialization error
  const filters = useSetState<IInvoiceTableFilters>({
    name: '',
    service: [],
    status: 'all',
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Fetch invoices from API
  useEffect(() => {
    const loadInvoices = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetchInvoices({
          status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
          search: currentFilters.name || undefined,
          start_date: currentFilters.startDate?.format('YYYY-MM-DD') || undefined,
          end_date: currentFilters.endDate?.format('YYYY-MM-DD') || undefined,
          per_page: table.rowsPerPage,
          page: table.page + 1, // API uses 1-based pagination
          sort_by: table.orderBy || 'created_at',
          sort_order: table.order || 'desc',
        });

        setTableData(result.data);
        setPagination(result.pagination);
      } catch (error: any) {
        console.error('Error fetching invoices:', error);
        toast.error(error?.message || t('dashboard.invoice.failedToLoad'));
        setTableData([]);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [
    user,
    currentFilters.status,
    currentFilters.name,
    currentFilters.startDate,
    currentFilters.endDate,
    table.page,
    table.rowsPerPage,
    table.orderBy,
    table.order,
    t,
  ]);

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  // Data is already filtered and paginated by API
  const dataFiltered = tableData;
  const dataInPage = tableData; // API handles pagination

  const canReset =
    !!currentFilters.name ||
    currentFilters.service.length > 0 ||
    currentFilters.status !== 'all' ||
    (!!currentFilters.startDate && !!currentFilters.endDate);

  const getInvoiceLength = (status: string) =>
    tableData.filter((item) => item.status === status).length;

  const getTotalAmount = (status: string) =>
    sumBy(
      tableData.filter((item) => item.status === status),
      (invoice) => invoice.totalAmount
    );

  const getPercentByStatus = (status: string) =>
    (getInvoiceLength(status) / tableData.length) * 100;

  const TABS = [
    {
      value: 'all',
      label: t('dashboard.invoice.tabs.all'),
      color: 'default',
      count: tableData.length,
    },
    {
      value: 'paid',
      label: t('dashboard.invoice.tabs.paid'),
      color: 'success',
      count: getInvoiceLength('paid'),
    },
    {
      value: 'pending',
      label: t('dashboard.invoice.tabs.pending'),
      color: 'warning',
      count: getInvoiceLength('pending'),
    },
  ] as const;

  const handleDeleteRow = useCallback(
    (id: string) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success(t('dashboard.invoice.deleteSuccess'));

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData, t]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    toast.success(t('dashboard.invoice.deleteSuccess'));

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows(dataInPage.length, pagination.total);
  }, [dataInPage.length, pagination.total, table, tableData, t]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('dashboard.invoice.deleteConfirmTitle')}
      content={
        <>
          {t('dashboard.invoice.deleteConfirmMessagePlural')}{' '}
          <strong> {table.selected.length} </strong> {t('dashboard.invoice.items')}?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          {t('dashboard.invoice.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.invoice.list')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: t('dashboard.invoice.heading'), href: paths.dashboard.invoice.root },
            { name: t('dashboard.invoice.list') },
          ]}
          action={
            canManageInvoices ? (
              <Button
                component={RouterLink}
                href={paths.dashboard.invoice.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('dashboard.invoice.addInvoice')}
              </Button>
            ) : null
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card sx={{ mb: { xs: 3, md: 5 } }}>
          <Scrollbar sx={{ minHeight: 108 }}>
            <Stack
              divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
              sx={{ py: 2, flexDirection: 'row' }}
            >
              <InvoiceAnalytic
                title={t('dashboard.invoice.analytics.total')}
                total={tableData.length}
                percent={100}
                price={sumBy(tableData, (invoice) => invoice.totalAmount)}
                icon="solar:bill-list-bold-duotone"
                color={theme.vars.palette.info.main}
              />

              <InvoiceAnalytic
                title={t('dashboard.invoice.analytics.paid')}
                total={getInvoiceLength('paid')}
                percent={getPercentByStatus('paid')}
                price={getTotalAmount('paid')}
                icon="solar:file-check-bold-duotone"
                color={theme.vars.palette.success.main}
              />

              <InvoiceAnalytic
                title={t('dashboard.invoice.analytics.pending')}
                total={getInvoiceLength('pending')}
                percent={getPercentByStatus('pending')}
                price={getTotalAmount('pending')}
                icon="solar:sort-by-time-bold-duotone"
                color={theme.vars.palette.warning.main}
              />
            </Stack>
          </Scrollbar>
        </Card>

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={{
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                iconPosition="end"
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                      'soft'
                    }
                    color={tab.color}
                  >
                    {tab.count}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <InvoiceTableToolbar
            filters={filters}
            dateError={dateError}
            onResetPage={table.onResetPage}
            options={{ services: INVOICE_SERVICE_OPTIONS.map((option) => option.name) }}
          />

          {canReset && (
            <InvoiceTableFiltersResult
              filters={filters}
              onResetPage={table.onResetPage}
              totalResults={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) => {
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                );
              }}
              action={
                <Box sx={{ display: 'flex' }}>
                  <Tooltip title={t('dashboard.invoice.sent')}>
                    <IconButton color="primary">
                      <Iconify icon="custom:send-fill" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('dashboard.invoice.download')}>
                    <IconButton color="primary">
                      <Iconify icon="solar:download-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('dashboard.invoice.print')}>
                    <IconButton color="primary">
                      <Iconify icon="solar:printer-minimalistic-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={t('dashboard.invoice.delete')}>
                    <IconButton color="primary" onClick={confirmDialog.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />

            <Scrollbar sx={{ minHeight: 444 }}>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={pagination.total}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataInPage.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_HEAD.length} align="center" sx={{ py: 3 }}>
                        {t('dashboard.invoice.loading')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {dataInPage.map((row) => (
                        <InvoiceTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onDeleteRow={() => handleDeleteRow(row.id)}
                          editHref={paths.dashboard.invoice.edit(row.id)}
                          detailsHref={paths.dashboard.invoice.details(row.id)}
                          canManageInvoices={canManageInvoices}
                        />
                      ))}

                      <TableEmptyRows
                        height={table.dense ? 56 : 56 + 20}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, pagination.total)}
                      />

                      <TableNoData notFound={!loading && !dataInPage.length} />
                    </>
                  )}
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={pagination.total}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

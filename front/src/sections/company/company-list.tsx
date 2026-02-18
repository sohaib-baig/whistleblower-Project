import type { TableHeadCellProps } from 'src/components/table';
import type { ICompanyItem, ICompanyTableFilters } from 'src/types/company';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales/use-locales';
import { startImpersonation } from 'src/actions/impersonation';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';
import { deleteCompany, useGetCompanies } from 'src/actions/company';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { CompanyTableRow } from './company-table-row';
import { CompanyTableToolbar } from './company-table-toolbar';
import { CompanyTableFiltersResult } from './company-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function CompanyListView() {
  const { t } = useTranslate('navbar');
  const table = useTable({ defaultOrderBy: 'createdAt', defaultOrder: 'desc' });

  const STATUS_OPTIONS = [
    { value: 'all', label: t('dashboard.company.all') },
    { value: 'active', label: t('dashboard.company.statusOptions.active', 'Active') },
    { value: 'pending', label: t('dashboard.company.statusOptions.pending', 'Pending') },
    { value: 'banned', label: t('dashboard.company.statusOptions.banned', 'Banned') },
  ];

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('dashboard.company.tableHeaders.companyName'), width: 250 },
    { id: 'phoneNumber', label: t('dashboard.company.tableHeaders.phoneNumber'), width: 150 },
    { id: 'address', label: t('dashboard.company.tableHeaders.address'), width: 220 },
    { id: 'status', label: t('dashboard.company.tableHeaders.status'), width: 100 },
    { id: '', width: 88 },
  ];

  const confirmDialog = useBoolean();

  const filters = useSetState<ICompanyTableFilters>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Memoize API filters to prevent infinite loop
  const apiFilters = useMemo(
    () => ({
      search: currentFilters.name,
      status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
      per_page: 100, // Get all for client-side filtering/sorting
    }),
    [currentFilters.name, currentFilters.status]
  );

  // Fetch companies from API
  const { companies, loading, error, refetch } = useGetCompanies(apiFilters);

  // Fetch all companies for accurate status counts
  const { companies: allCompanies } = useGetCompanies({ per_page: 1000 });

  // Track status counts separately
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, pending: 0, banned: 0 });

  // Update status counts when all companies are fetched
  useEffect(() => {
    if (allCompanies) {
      const active = allCompanies.filter((item) => item.status === 'active').length;
      const pending = allCompanies.filter((item) => item.status === 'pending').length;
      const banned = allCompanies.filter((item) => item.status === 'banned').length;
      setStatusCounts({
        all: allCompanies.length,
        active,
        pending,
        banned,
      });
    }
  }, [allCompanies]);

  const dataFiltered = applyFilter({
    inputData: companies,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name || (!!currentFilters.status && currentFilters.status !== 'all');

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await deleteCompany(id);
        toast.success(t('dashboard.company.companyDeleted'));
        refetch(); // Refresh the list
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (err) {
        console.error('Failed to delete company:', err);
        toast.error(t('dashboard.company.failedToDelete'));
      }
    },
    [dataInPage.length, table, refetch, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => deleteCompany(id)));
      toast.success(t('dashboard.company.companiesDeleted'));
      refetch(); // Refresh the list
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    } catch (err) {
      console.error('Failed to delete companies:', err);
      toast.error(t('dashboard.company.failedToDeletePlural'));
    }
  }, [dataFiltered.length, dataInPage.length, table, refetch, t]);

  const handleAccessAccount = useCallback(
    async (id: string) => {
      try {
        await startImpersonation(id);
        toast.success(t('dashboard.company.successfullyLoggedIn'));

        // Always redirect to analytics dashboard after impersonation
        const redirectPath = paths.dashboard.overview.analytics;

        // Verify session is established before redirecting
        // Wait a bit for the session cookie to be set and processed by the browser
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // Ensure CSRF cookie is set
        await initSanctumCsrf();
        
        // Verify authentication by checking the session (retry up to 3 times)
        let sessionVerified = false;
        for (let i = 0; i < 3; i++) {
          try {
            const meResponse = await sanctum.get('/api/v1/auth/me');
            const userData = (meResponse as any)?.data?.user ?? (meResponse as any)?.data;
            if (userData) {
              sessionVerified = true;
              break;
            }
          } catch (authError) {
            if (i < 2) {
              // Wait a bit longer before retrying
              await new Promise((resolve) => setTimeout(resolve, 500));
            } else {
              console.error('Session verification failed after retries:', authError);
            }
          }
        }

        if (!sessionVerified) {
          toast.error('Session verification failed. Please try again.');
          return;
        }

        // Set flag to indicate impersonation just happened (similar to just_logged_in)
        // This will trigger the AuthProvider to refresh the session
        sessionStorage.setItem('just_impersonated', 'true');
        
        // Use window.location.href for full page reload to ensure session is properly checked
        // This prevents AuthGuard from checking before session is established
        window.location.href = redirectPath;
      } catch (err) {
        console.error('Failed to access account:', err);
        toast.error(t('dashboard.company.failedToAccessAccount'));
      }
    },
    [t]
  );

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
      title={t('dashboard.company.deleteConfirmTitle')}
      content={
        <>
          {t('dashboard.company.deleteConfirmMessagePlural')}{' '}
          <strong> {table.selected.length} </strong> {t('dashboard.company.companies')}?
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
          {t('dashboard.company.delete')}
        </Button>
      }
    />
  );

  // Show loading state
  if (loading) {
    return (
      <>
        <CustomBreadcrumbs
          heading={t('dashboard.company.heading')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.company.heading'), href: paths.dashboard.company.root },
            { name: t('dashboard.company.list') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <CustomBreadcrumbs
          heading={t('dashboard.company.heading')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.company.heading'), href: paths.dashboard.company.root },
            { name: t('dashboard.company.list') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ color: 'error.main', mb: 2 }}>
            <Iconify icon="solar:danger-bold" width={48} />
          </Box>
          <Box sx={{ typography: 'h6', mb: 1 }}>{t('dashboard.company.errorLoadingCompanies')}</Box>
          <Box sx={{ typography: 'body2', color: 'text.secondary', mb: 2 }}>{error}</Box>
          <Button variant="contained" onClick={refetch}>
            {t('dashboard.company.retry')}
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={t('dashboard.company.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.company.heading'), href: paths.dashboard.company.root },
          { name: t('dashboard.company.list') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.company.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('dashboard.company.createCompany')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={currentFilters.status || 'all'}
          onChange={handleFilterStatus}
          sx={[
            (theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {STATUS_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                    'soft'
                  }
                  color={
                    (tab.value === 'active' && 'success') ||
                    (tab.value === 'pending' && 'warning') ||
                    (tab.value === 'banned' && 'error') ||
                    'default'
                  }
                >
                  {tab.value === 'all'
                    ? statusCounts.all
                    : tab.value === 'active'
                      ? statusCounts.active
                      : tab.value === 'pending'
                        ? statusCounts.pending
                        : tab.value === 'banned'
                          ? statusCounts.banned
                          : 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        <CompanyTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          statusOptions={STATUS_OPTIONS}
        />

        {canReset && (
          <CompanyTableFiltersResult
            filters={filters}
            totalResults={dataFiltered.length}
            onResetPage={table.onResetPage}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) =>
              table.onSelectAllRows(
                checked,
                dataFiltered.map((row) => row.id)
              )
            }
            action={
              <Tooltip title="Delete">
                <IconButton color="primary" onClick={confirmDialog.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            }
          />

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    dataFiltered.map((row) => row.id)
                  )
                }
              />

              <TableBody>
                {dataFiltered.map((row) => (
                  <CompanyTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    onAccessAccount={() => handleAccessAccount(row.id)}
                    editHref={paths.dashboard.company.edit(row.id)}
                  />
                ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 56 + 20}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: ICompanyItem[];
  filters: ICompanyTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name && typeof name === 'string') {
    inputData = inputData.filter((company) =>
      company.name?.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (status && status !== 'all') {
    inputData = inputData.filter((company) => company.status === status);
  }

  return inputData;
}

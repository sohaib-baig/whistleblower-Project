import type { TableHeadCellProps } from 'src/components/table';
import type { ICaseManagerItem, ICaseManagerTableFilters } from 'src/types/case-manager';

import { useMemo, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { startImpersonation } from 'src/actions/impersonation';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';
import { deleteCaseManager, useGetCaseManagers } from 'src/actions/case-manager';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
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

import { useAuthContext } from 'src/auth/hooks';

import { CaseManagerTableRow } from './case-manager-table-row';
import { CaseManagerTableToolbar } from './case-manager-table-toolbar';
import { CaseManagerTableFiltersResult } from './case-manager-table-filters-result';

// ----------------------------------------------------------------------

export default function CaseManagerListViewComponent() {
  const { t } = useTranslate('navbar');
  const router = useRouter();
  const { user } = useAuthContext();
  const userRole = (user?.role || '').toLowerCase();
  const canAccessAccount = userRole !== 'company';

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('dashboard.caseManager.tableHeaders.name'), width: 180 },
    { id: 'email', label: t('dashboard.caseManager.tableHeaders.email'), width: 200 },
    { id: 'phone', label: t('dashboard.caseManager.tableHeaders.phone'), width: 150 },
    { id: 'isVerified', label: t('dashboard.caseManager.tableHeaders.verified'), width: 100 },
    { id: 'isActive', label: t('dashboard.caseManager.tableHeaders.active'), width: 100 },
    { id: 'status', label: t('dashboard.caseManager.tableHeaders.status'), width: 120 },
    { id: 'createdAt', label: t('dashboard.caseManager.tableHeaders.created'), width: 140 },
    { id: '', width: 88 },
  ];
  const table = useTable({ defaultOrderBy: 'createdAt', defaultOrder: 'desc' });

  const confirmDialog = useBoolean();

  const filters = useSetState<ICaseManagerTableFilters>({
    name: '',
    email: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Memoize API filters to prevent infinite loop
  const apiFilters = useMemo(
    () => ({
      search: currentFilters.name || currentFilters.email,
      status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
      per_page: 100, // Get all for client-side filtering/sorting
    }),
    [currentFilters.name, currentFilters.email, currentFilters.status]
  );

  // Fetch case managers from API
  const { caseManagers, loading, error, refetch } = useGetCaseManagers(apiFilters);

  const dataFiltered = applyFilter({
    inputData: caseManagers,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name || !!currentFilters.email || currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await deleteCaseManager(id);
        toast.success(t('dashboard.caseManager.caseManagerDeleted'));
        refetch(); // Refresh the list
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (err) {
        console.error('Failed to delete case manager:', err);
        toast.error(t('dashboard.caseManager.failedToDelete'));
      }
    },
    [dataInPage.length, table, refetch, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => deleteCaseManager(id)));
      toast.success(t('dashboard.caseManager.caseManagersDeleted'));
      refetch(); // Refresh the list
      table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
    } catch (err) {
      console.error('Failed to delete case managers:', err);
      toast.error(t('dashboard.caseManager.failedToDeletePlural'));
    }
  }, [dataFiltered.length, dataInPage.length, table, refetch, t]);

  const handleFilters = useCallback(
    (name: string, value: string) => {
      table.onResetPage();
      updateFilters({ [name]: value });
    },
    [updateFilters, table]
  );

  const handleResetFilter = useCallback(() => {
    updateFilters({
      name: '',
      email: '',
      status: 'all',
    });
  }, [updateFilters]);

  const handleEditRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.caseManager.edit(id));
    },
    [router]
  );

  const handleAccessAccount = useCallback(
    async (id: string) => {
      try {
        await startImpersonation(id);
        toast.success(t('dashboard.caseManager.successfullyLoggedIn'));

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
        toast.error(t('dashboard.caseManager.failedToAccessAccount'));
      }
    },
    [t]
  );

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ color: 'error.main', mb: 2 }}>
          <Iconify icon="solar:danger-bold" width={48} />
        </Box>
        <Box sx={{ typography: 'h6', mb: 1 }}>{t('dashboard.caseManager.errorLoading')}</Box>
        <Box sx={{ typography: 'body2', color: 'text.secondary', mb: 2 }}>{error}</Box>
        <Button variant="contained" onClick={refetch}>
          {t('dashboard.caseManager.retry')}
        </Button>
      </Card>
    );
  }

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('dashboard.caseManager.deleteConfirmTitle')}
      content={
        <>
          {t('dashboard.caseManager.deleteConfirmMessagePlural')}{' '}
          <strong> {table.selected.length} </strong> {t('dashboard.caseManager.items')}?
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
          {t('dashboard.caseManager.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <Card>
        <CaseManagerTableToolbar
          filters={currentFilters}
          onFilters={handleFilters}
          onResetFilter={handleResetFilter}
        />

        {canReset && (
          <CaseManagerTableFiltersResult
            filters={currentFilters}
            onFilters={handleFilters}
            onResetFilter={handleResetFilter}
            results={dataFiltered.length}
          />
        )}

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
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
              <Tooltip title={t('dashboard.caseManager.delete')}>
                <IconButton color="primary" onClick={confirmDialog.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            }
          />

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
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
                  <CaseManagerTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onEditRow={() => handleEditRow(row.id)}
                    canAccessAccount={canAccessAccount}
                    onAccessAccount={() => handleAccessAccount(row.id)}
                    onDeleteRow={() => handleDeleteRow(row.id)}
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
        </TableContainer>

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
  inputData: ICaseManagerItem[];
  filters: ICaseManagerTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, email, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name && typeof name === 'string') {
    inputData = inputData.filter((caseManager) =>
      caseManager.name?.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (email && typeof email === 'string') {
    inputData = inputData.filter((caseManager) =>
      caseManager.email?.toLowerCase().includes(email.toLowerCase())
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((caseManager) => caseManager.status === status);
  }

  return inputData;
}

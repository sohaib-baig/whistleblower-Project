import type { ICaseTableFilters } from 'src/types/case';
import type { TableHeadCellProps } from 'src/components/table';
import type { CaseListItem } from 'src/actions/company-case-details';

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
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';
import { downloadCaseAsPDFs } from 'src/utils/case-pdf-export';

import { useTranslate } from 'src/locales';
import { getCasesList } from 'src/actions/company-case-details';

import { Label } from 'src/components/label';
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

import { CaseAnalytic } from './case-analytic';
import { CaseTableRow } from './case-table-row';
import { CaseTableToolbar } from './case-table-toolbar';
import { CaseTableFiltersResult } from './case-table-filters-result';

// ----------------------------------------------------------------------

export function CaseListView() {
  const { t } = useTranslate('navbar');
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthContext();

  const isAdmin = user?.role === 'admin';

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'case_id', label: t('dashboard.case.tableHeaders.caseId') },
    ...(isAdmin ? [{ id: 'company', label: t('dashboard.case.tableHeaders.company'), width: 180 }] : []),
    { id: 'subject', label: t('dashboard.case.tableHeaders.subject'), width: 250 },
    { id: 'category', label: t('dashboard.case.tableHeaders.category'), width: 130 },
    { id: 'case_manager', label: t('dashboard.case.tableHeaders.caseManager'), width: 150 },
    { id: 'status', label: t('dashboard.case.tableHeaders.status'), width: 120 },
    { id: 'created_at', label: t('dashboard.case.tableHeaders.createdDate'), width: 140 },
    { id: '', width: 88 },
  ];

  const table = useTable({ defaultOrderBy: 'created_at', defaultOrder: 'desc' });

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<CaseListItem[]>([]);

  // Fetch cases from API
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await getCasesList();
        setTableData(data);
      } catch (err: any) {
        console.error('Error fetching cases:', err);
        setTableData([]);
      }
    };

    if (user) {
      fetchCases();
    }
  }, [user]);

  const searchParams = useSearchParams();
  
  // Read deadline period filters from URL query parameters
  const openDeadlinePeriod = searchParams.get('open_deadline_period') || null;
  const closeDeadlinePeriod = searchParams.get('close_deadline_period') || null;

  const filters = useSetState<ICaseTableFilters>({
    name: '',
    category: [],
    status: 'all',
    startDate: null,
    endDate: null,
    open_deadline_period: openDeadlinePeriod || null,
    close_deadline_period: closeDeadlinePeriod || null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Update filters when URL params change
  useEffect(() => {
    if (openDeadlinePeriod !== currentFilters.open_deadline_period || 
        closeDeadlinePeriod !== currentFilters.close_deadline_period) {
      updateFilters({
        open_deadline_period: openDeadlinePeriod || null,
        close_deadline_period: closeDeadlinePeriod || null,
      });
    }
  }, [openDeadlinePeriod, closeDeadlinePeriod, currentFilters.open_deadline_period, currentFilters.close_deadline_period, updateFilters]);

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!currentFilters.name ||
    currentFilters.category.length > 0 ||
    currentFilters.status !== 'all' ||
    (!!currentFilters.startDate && !!currentFilters.endDate) ||
    !!currentFilters.open_deadline_period ||
    !!currentFilters.close_deadline_period;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const getCaseLength = (status: string) =>
    tableData.filter((item) => item.status === status).length;

  const getPercentByStatus = (status: string) => (getCaseLength(status) / tableData.length) * 100;

  const TABS = [
    {
      value: 'all',
      label: t('dashboard.case.tabs.all'),
      color: 'default',
      count: tableData.length,
    },
    {
      value: 'new',
      label: t('dashboard.case.tabs.new'),
      color: 'info',
      count: getCaseLength('new'),
    },
    {
      value: 'in_progress',
      label: t('dashboard.case.tabs.inProgress'),
      color: 'warning',
      count: getCaseLength('in_progress'),
    },
    {
      value: 'open',
      label: t('dashboard.case.tabs.open'),
      color: 'success',
      count: getCaseLength('open'),
    },
    {
      value: 'closed',
      label: t('dashboard.case.tabs.closed'),
      color: 'default',
      count: getCaseLength('closed'),
    },
  ] as const;

  const handleDeleteRow = useCallback(
    (id: string) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success(t('dashboard.case.deleteSuccess'));

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData, t]
  );

  const handleDownloadRow = useCallback(
    async (id: string) => {
      try {
        const caseItem = tableData.find((row) => row.id === id);
        if (!caseItem) {
          toast.error('Case not found');
          return;
        }
        await downloadCaseAsPDFs(id, caseItem);
      } catch (error) {
        console.error('Error downloading case:', error);
        toast.error('Failed to download case documents');
      }
    },
    [tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    toast.success(t('dashboard.case.deleteSuccess'));

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
  }, [dataFiltered.length, dataInPage.length, table, tableData, t]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleFilters = useCallback(
    (name: string, value: string | string[]) => {
      table.onResetPage();
      updateFilters({ [name]: value });
    },
    [updateFilters, table]
  );

  const handleFilterCategory = useCallback(
    (event: any) => {
      const value = event.target.value;
      handleFilters('category', value);
    },
    [handleFilters]
  );

  const handleResetFilter = useCallback(() => {
    updateFilters({
      name: '',
      category: [],
      status: 'all',
      startDate: null,
      endDate: null,
    });
  }, [updateFilters]);

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('dashboard.case.deleteConfirmTitle')}
      content={
        <>
          {t('dashboard.case.deleteConfirmMessagePlural')}{' '}
          <strong> {table.selected.length} </strong> {t('dashboard.case.items')}?
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
          {t('dashboard.case.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <Card sx={{ mb: { xs: 3, md: 5 } }}>
        <Scrollbar sx={{ minHeight: 108 }}>
          <Stack
            divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
            sx={{ py: 2, flexDirection: 'row' }}
          >
            <CaseAnalytic
              title={t('dashboard.case.analytics.total')}
              total={tableData.length}
              percent={100}
              icon="solar:bill-list-bold-duotone"
              color={theme.vars.palette.info.main}
            />

            <CaseAnalytic
              title={t('dashboard.case.analytics.new')}
              total={getCaseLength('new')}
              percent={getPercentByStatus('new')}
              icon="solar:file-bold-duotone"
              color={theme.vars.palette.info.main}
            />

            <CaseAnalytic
              title={t('dashboard.case.analytics.inProgress')}
              total={getCaseLength('in_progress')}
              percent={getPercentByStatus('in_progress')}
              icon="solar:sort-by-time-bold-duotone"
              color={theme.vars.palette.warning.main}
            />

            <CaseAnalytic
              title={t('dashboard.case.analytics.open')}
              total={getCaseLength('open')}
              percent={getPercentByStatus('open')}
              icon="solar:file-bold-duotone"
              color={theme.vars.palette.success.main}
            />

            <CaseAnalytic
              title={t('dashboard.case.analytics.closed')}
              total={getCaseLength('closed')}
              percent={getPercentByStatus('closed')}
              icon="solar:file-check-bold-duotone"
              color={theme.vars.palette.text.secondary}
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

        <CaseTableToolbar
          filters={{
            name: currentFilters.name,
            status: currentFilters.status,
            category: currentFilters.category,
          }}
          onFilters={handleFilters}
          onFilterStatus={() => {}}
          onFilterCategory={handleFilterCategory}
          onResetFilter={handleResetFilter}
          dateError={dateError}
        />

        {canReset && (
          <CaseTableFiltersResult
            filters={{
              name: currentFilters.name,
              status: currentFilters.status,
              category: currentFilters.category,
            }}
            onFilters={handleFilters}
            onResetFilter={handleResetFilter}
            results={dataFiltered.length}
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
              <Tooltip title="Delete">
                <IconButton color="primary" onClick={confirmDialog.onTrue}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            }
          />

          <Scrollbar sx={{ minHeight: 444 }}>
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
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <CaseTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onViewRow={(id) =>
                        router.push(`${paths.dashboard.case.root}/${id}/details-tabs`)
                      }
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onDownloadRow={handleDownloadRow}
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
  dateError: boolean;
  inputData: CaseListItem[];
  filters: ICaseTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters, dateError }: ApplyFilterProps) {
  const { name, status, category, startDate, endDate, open_deadline_period, close_deadline_period } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((caseItem) =>
      [
        caseItem.company?.name,
        caseItem.title,
        caseItem.subject,
        caseItem.case_id,
        caseItem.case_manager?.name,
        caseItem.category?.name,
      ].some((field) => field?.toLowerCase().includes(name.toLowerCase()))
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((caseItem) => caseItem.status === status);
  }

  if (category.length) {
    inputData = inputData.filter((caseItem) => category.includes(caseItem.category?.name || ''));
  }

  // Filter by open deadline period
  if (open_deadline_period) {
    inputData = inputData.filter((caseItem) => {
      if (!caseItem.open_deadline_number || !caseItem.open_deadline_period) {
        return false;
      }
      return caseItem.open_deadline_period.toLowerCase() === open_deadline_period.toLowerCase();
    });
  }

  // Filter by close deadline period
  if (close_deadline_period) {
    inputData = inputData.filter((caseItem) => {
      if (!caseItem.close_deadline_number || !caseItem.close_deadline_period) {
        return false;
      }
      return caseItem.close_deadline_period.toLowerCase() === close_deadline_period.toLowerCase();
    });
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((caseItem) =>
        fIsBetween(caseItem.created_at, startDate, endDate)
      );
    }
  }

  return inputData;
}

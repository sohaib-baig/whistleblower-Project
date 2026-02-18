import type { TableHeadCellProps } from 'src/components/table';
import type { IStateItem, IStateTableFilters } from 'src/types/state';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { STATE_STATUS_OPTIONS } from 'src/_mock/_state';
import { deleteState, useGetState, useGetStates } from 'src/actions/state';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { StateTableRow } from './state-table-row';
import { StateTableToolbar } from './state-table-toolbar';
import { StateCreateEditForm } from './state-create-edit-form';
import { StateTableFiltersResult } from './state-table-filters-result';

// ----------------------------------------------------------------------

// const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...STATE_STATUS_OPTIONS];

// TABLE_HEAD will be defined inside component to use translations

// ----------------------------------------------------------------------

type StateListViewProps = {
  showBreadcrumbs?: boolean;
  showActionButton?: boolean;
};

export default function StateListView({
  showBreadcrumbs = true,
  showActionButton = true,
}: StateListViewProps) {
  const { t } = useTranslate('navbar');
  const table = useTable();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('dashboard.state.tableHeaders.stateName'), width: 250 },
    { id: 'status', label: t('dashboard.state.tableHeaders.status'), width: 100 },
    { id: 'createdAt', label: t('dashboard.state.tableHeaders.createdAt'), width: 180 },
    { id: '', width: 88 },
  ];

  const confirmDialog = useBoolean();
  const createDialog = useBoolean();
  const editDialog = useBoolean();
  const [editingStateId, setEditingStateId] = useState<string | null>(null);

  const filters = useSetState<IStateTableFilters>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Fetch states from API
  const { states, pagination, refetch } = useGetStates({
    search: currentFilters.name,
    status: currentFilters.status,
    per_page: table.rowsPerPage,
    page: table.page + 1,
    sort: table.orderBy || 'created_at',
    order: table.order,
  });

  const [tableData, setTableData] = useState<IStateItem[]>([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, inactive: 0 });

  // Fetch counts for all statuses to display in tabs
  const { states: allStates } = useGetStates({ per_page: 1000 });

  // Update status counts when all states are fetched
  useEffect(() => {
    if (allStates) {
      const active = allStates.filter((item) => item.status === 'active').length;
      const inactive = allStates.filter((item) => item.status === 'inactive').length;
      setStatusCounts({
        all: allStates.length,
        active,
        inactive,
      });
    }
  }, [allStates]);

  // Update table data when states are fetched
  useEffect(() => {
    if (states) {
      setTableData(states);
    }
  }, [states]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset =
    !!currentFilters.name || (currentFilters.status !== 'all' && !!currentFilters.status);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        await deleteState(id);
        toast.success(t('dashboard.state.toast.deletedSuccessfully'));
        refetch(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete state:', err);
        toast.error(t('dashboard.state.toast.deleteFailed'));
      }
    },
    [refetch, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => deleteState(id)));
      toast.success(t('dashboard.state.toast.deletedMultipleSuccessfully'));
      table.onSelectAllRows(false, []); // Clear selection
      refetch(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete states:', err);
      toast.error(t('dashboard.state.toast.deleteMultipleFailed'));
    }
  }, [table, refetch, t]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleEdit = useCallback(
    (id: string) => {
      setEditingStateId(id);
      editDialog.onTrue();
    },
    [editDialog]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title={t('dashboard.state.confirmDialog.delete')}
      content={
        <>
          {t('dashboard.state.confirmDialog.deleteMultipleConfirm', {
            count: table.selected.length,
          })}
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
          {t('dashboard.state.confirmDialog.delete')}
        </Button>
      }
    />
  );

  const TABS = [
    {
      value: 'all',
      label: t('dashboard.state.tabs.all'),
      color: 'default',
      count: statusCounts.all,
    },
    {
      value: 'active',
      label: t('dashboard.state.tabs.active'),
      color: 'success',
      count: statusCounts.active,
    },
    {
      value: 'inactive',
      label: t('dashboard.state.tabs.inactive'),
      color: 'error',
      count: statusCounts.inactive,
    },
  ] as const;

  return (
    <>
      {showBreadcrumbs ? (
        <CustomBreadcrumbs
          heading={t('dashboard.state.list')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: t('dashboard.state.heading'), href: paths.dashboard.state.root },
            { name: t('dashboard.state.list') },
          ]}
          action={
            showActionButton ? (
              <Button
                component={RouterLink}
                href={paths.dashboard.state.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('dashboard.state.addState')}
              </Button>
            ) : undefined
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />
      ) : (
        showActionButton && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 3, md: 5 } }}>
            <Button
              onClick={createDialog.onTrue}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('dashboard.state.addState')}
            </Button>
          </Box>
        )
      )}

      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={[
            (theme) => ({
              px: { md: 2.5 },
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
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

        <StateTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => updateFilters({ [name]: value })}
          statusOptions={STATE_STATUS_OPTIONS.map((option) => option.label)}
        />

        {canReset && (
          <StateTableFiltersResult
            filters={currentFilters}
            onFilters={(name, value) => updateFilters({ [name]: value })}
            onResetFilters={() => updateFilters({ name: '', status: 'all' })}
            results={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          {table.selected.length > 0 && (
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
                <Tooltip title={t('dashboard.state.tooltip.delete')}>
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />
          )}

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
                  <StateTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={paths.dashboard.state.edit(row.id)}
                    onEdit={handleEdit}
                  />
                ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 56 + 20}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, pagination.total)}
                />

                <TableNoData notFound={notFound} />
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

      {renderConfirmDialog()}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={createDialog.value}
        onClose={createDialog.onFalse}
      >
        <DialogTitle>{t('dashboard.state.createNewState')}</DialogTitle>
        <DialogContent>
          <StateCreateEditForm
            onClose={createDialog.onFalse}
            onSuccess={() => {
              createDialog.onFalse();
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {editingStateId && (
        <EditStateDialog
          open={editDialog.value}
          stateId={editingStateId}
          onClose={() => {
            editDialog.onFalse();
            setEditingStateId(null);
          }}
          onSuccess={() => {
            editDialog.onFalse();
            setEditingStateId(null);
            refetch();
          }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

type EditStateDialogProps = {
  open: boolean;
  stateId: string;
  onClose: () => void;
  onSuccess: () => void;
};

function EditStateDialog({ open, stateId, onClose, onSuccess }: EditStateDialogProps) {
  const { t } = useTranslate('navbar');
  const { state, loading } = useGetState(stateId);

  if (loading) {
    return (
      <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
        <DialogContent>
          <LoadingScreen />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>{t('dashboard.state.editState')}</DialogTitle>
      <DialogContent>
        {state && (
          <StateCreateEditForm
            currentState={state}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filters,
}: {
  inputData: IStateItem[];
  comparator: (a: any, b: any) => number;
  filters: IStateTableFilters;
}) {
  const { name, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name && typeof name === 'string') {
    inputData = inputData.filter(
      (item) => item.name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((item) => item.status === status);
  }

  return inputData;
}

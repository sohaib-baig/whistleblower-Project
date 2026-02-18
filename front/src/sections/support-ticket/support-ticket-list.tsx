import type { TableHeadCellProps } from 'src/components/table';
import type { ISupportTicketItem, ISupportTicketTableFilters } from 'src/types/support-ticket';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { fetchSupportTickets } from 'src/actions/support-ticket';

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
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { SupportTicketTableRow } from './support-ticket-table-row';
import { SupportTicketTableToolbar } from './support-ticket-table-toolbar';
import { SupportTicketTableFiltersResult } from './support-ticket-table-filters-result';
import { SupportTicketTableSelectedAction } from './support-ticket-table-selected-action';

// ----------------------------------------------------------------------

export function SupportTicketListView() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuthContext();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'id', label: 'Ticket ID', width: 140 },
    { id: 'title', label: 'Subject', width: 250 },
    { id: 'creator', label: 'Created By', width: 180 },
    { id: 'status', label: 'Status', width: 120 },
    { id: 'unread_count', label: 'Unread', width: 100 },
    { id: 'created_at', label: 'Created Date', width: 140 },
    { id: '', width: 88 },
  ];

  const table = useTable({ defaultOrderBy: 'created_at', defaultOrder: 'desc' });

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<ISupportTicketItem[]>([]);

  // Fetch support tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await fetchSupportTickets();
        setTableData(data.data);
      } catch {
        setTableData([]);
      }
    };

    if (user) {
      fetchTickets();
    }
  }, [user]);

  const filters = useSetState<ISupportTicketTableFilters>({
    name: '',
    status: 'all',
    startDate: null,
    endDate: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

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
    currentFilters.status !== 'all' ||
    (!!currentFilters.startDate && !!currentFilters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const getTicketLength = (status: string) =>
    tableData.filter((item) => item.status === status).length;

  const TABS = [
    {
      value: 'all',
      label: 'All',
      color: 'default',
      count: tableData.length,
    },
    {
      value: 'open',
      label: 'Open',
      color: 'success',
      count: getTicketLength('open'),
    },
    {
      value: 'closed',
      label: 'Closed',
      color: 'default',
      count: getTicketLength('closed'),
    },
  ] as const;

  const handleDeleteRow = useCallback(
    (id: string) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success('Support ticket deleted successfully');

      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    toast.success('Support tickets deleted successfully');

    setTableData(deleteRows);

    table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleFilters = useCallback(
    (name: string, value: string | Date | null) => {
      table.onResetPage();
      updateFilters({ [name]: value });
    },
    [updateFilters, table]
  );

  const handleViewRow = useCallback(
    (id: string) => {
      router.push(paths.dashboard.supportTicket.details(id));
    },
    [router]
  );

  return (
    <>
      <Card>
        <Tabs
          value={currentFilters.status}
          onChange={handleFilterStatus}
          sx={{
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {TABS.map((tab) => (
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
                  color={tab.color}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </Tabs>

        <SupportTicketTableToolbar
          filters={currentFilters}
          onFilters={handleFilters}
          //
          dateError={dateError}
        />

        {canReset && (
          <SupportTicketTableFiltersResult
            filters={currentFilters}
            onFilters={handleFilters}
            //
            onResetFilters={() => {
              updateFilters({
                name: '',
                status: 'all',
                startDate: null,
                endDate: null,
              });
            }}
            //
            results={dataFiltered.length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <SupportTicketTableSelectedAction
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
                  <Iconify icon="solar:trash-bin-minimalistic-bulk" />
                </IconButton>
              </Tooltip>
            }
          />

          <Scrollbar sx={{ minHeight: 444 }}>
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
                {dataInPage.map((row) => (
                  <SupportTicketTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onViewRow={() => handleViewRow(row.id)}
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
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          onChangeDense={table.onChangeDense}
        />
      </Card>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
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
            Delete
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filters,
  dateError,
}: {
  inputData: ISupportTicketItem[];
  comparator: (a: any, b: any) => number;
  filters: ISupportTicketTableFilters;
  dateError: boolean;
}) {
  const { name, status, startDate, endDate } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (ticket) =>
        ticket.title.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        ticket.creator.name.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        ticket.creator.company_name?.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((ticket) => ticket.status === status);
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter((ticket) => fIsBetween(ticket.created_at, startDate, endDate));
    }
  }

  return inputData;
}
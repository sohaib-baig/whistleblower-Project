import type { TableHeadCellProps } from 'src/components/table';
import type { ICategoryItem, ICategoryTableFilters } from 'src/types/category';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { CATEGORY_STATUS_OPTIONS } from 'src/_mock/_category';
import { deleteCategory, useGetCategories } from 'src/actions/category';

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
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { CategoryTableRow } from './category-table-row';
import { CategoryTableToolbar } from './category-table-toolbar';
import { CategoryTableFiltersResult } from './category-table-filters-result';

// ----------------------------------------------------------------------

export default function CategoryListView() {
  const { t } = useTranslate('navbar');
  const table = useTable();

  const confirmDialog = useBoolean();

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('dashboard.category.tableHeaders.categoryName'), width: 250 },
    { id: 'status', label: t('dashboard.category.tableHeaders.status'), width: 100 },
    { id: 'createdAt', label: t('dashboard.category.tableHeaders.createdAt'), width: 180 },
    { id: '', width: 88 },
  ];

  const filters = useSetState<ICategoryTableFilters>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Fetch categories from API
  const { categories, pagination, refetch } = useGetCategories({
    search: currentFilters.name,
    status: currentFilters.status,
    per_page: table.rowsPerPage,
    page: table.page + 1,
    sort: table.orderBy || 'created_at',
    order: table.order,
  });

  const [tableData, setTableData] = useState<ICategoryItem[]>([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, inactive: 0 });

  // Fetch counts for all statuses to display in tabs
  const { categories: allCategories } = useGetCategories({ per_page: 1000 });

  // Update status counts when all categories are fetched
  useEffect(() => {
    if (allCategories) {
      const active = allCategories.filter((item) => item.status === 'active').length;
      const inactive = allCategories.filter((item) => item.status === 'inactive').length;
      setStatusCounts({
        all: allCategories.length,
        active,
        inactive,
      });
    }
  }, [allCategories]);

  // Update table data when categories are fetched
  useEffect(() => {
    if (categories) {
      setTableData(categories);
    }
  }, [categories]);

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
        await deleteCategory(id);
        toast.success(t('dashboard.category.categoryDeleted'));
        refetch(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete category:', err);
        toast.error(t('dashboard.category.failedToDelete'));
      }
    },
    [refetch, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => deleteCategory(id)));
      toast.success(t('dashboard.category.categoriesDeleted'));
      table.onSelectAllRows(false, []); // Clear selection
      refetch(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete categories:', err);
      toast.error(t('dashboard.category.failedToDeletePlural'));
    }
  }, [table, refetch, t]);

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
      title={t('dashboard.category.deleteConfirmTitle')}
      content={
        <>
          {t('dashboard.category.deleteConfirmMessagePlural')}{' '}
          <strong> {table.selected.length} </strong> {t('dashboard.category.items')}?
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
          {t('dashboard.category.delete')}
        </Button>
      }
    />
  );

  const TABS = [
    {
      value: 'all',
      label: t('dashboard.category.all'),
      color: 'default',
      count: statusCounts.all,
    },
    {
      value: 'active',
      label: t('dashboard.category.active'),
      color: 'success',
      count: statusCounts.active,
    },
    {
      value: 'inactive',
      label: t('dashboard.category.inactive'),
      color: 'error',
      count: statusCounts.inactive,
    },
  ] as const;

  return (
    <>
      <CustomBreadcrumbs
        heading={t('dashboard.category.list')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.category.heading'), href: paths.dashboard.category.root },
          { name: t('dashboard.category.list') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.category.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('dashboard.category.addCategory')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

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

        <CategoryTableToolbar
          filters={currentFilters}
          onFilters={(name, value) => updateFilters({ [name]: value })}
          statusOptions={CATEGORY_STATUS_OPTIONS.map((option) => option.label)}
        />

        {canReset && (
          <CategoryTableFiltersResult
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
                <Tooltip title={t('dashboard.category.delete')}>
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
                  <CategoryTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={paths.dashboard.category.edit(row.id)}
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
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({
  inputData,
  comparator,
  filters,
}: {
  inputData: ICategoryItem[];
  comparator: (a: any, b: any) => number;
  filters: ICategoryTableFilters;
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

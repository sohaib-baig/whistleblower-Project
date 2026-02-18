import type { EmailTemplate } from 'src/types/email-template';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import React, { useState, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import { deleteEmailTemplate, useGetEmailTemplates } from 'src/actions/email-template';

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

import { EmailTemplateTableRow } from './email-template-table-row';
import { EmailTemplateTableToolbar } from './email-template-table-toolbar';
import { EmailTemplateTableFiltersResult } from './email-template-table-filters-result';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function EmailTemplateList() {
  const { t } = useTranslate('navbar');
  const table = useTable();

  const STATUS_OPTIONS = [
    { value: 'all', label: t('dashboard.emailTemplate.tabs.all') },
    { value: 'active', label: t('dashboard.emailTemplate.tabs.active') },
    { value: 'inactive', label: t('dashboard.emailTemplate.tabs.inactive') },
  ];

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('dashboard.emailTemplate.tableHead.templateName'), width: 220 },
    { id: 'subject', label: t('dashboard.emailTemplate.tableHead.subject'), width: 200 },
    { id: 'language', label: t('dashboard.emailTemplate.tableHead.language'), width: 120 },
    { id: 'status', label: t('dashboard.emailTemplate.tableHead.status'), width: 100 },
    { id: 'createdAt', label: t('dashboard.emailTemplate.tableHead.createdAt'), width: 180 },
    { id: '', width: 88 },
  ];

  const confirmDialog = useBoolean();

  const filters = useSetState<{ name: string; status: string }>({ name: '', status: 'all' });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Fetch email templates from API
  const { templates, pagination, refetch } = useGetEmailTemplates({
    search: currentFilters.name,
    status: currentFilters.status,
    per_page: table.rowsPerPage,
    page: table.page + 1,
    sort: table.orderBy || 'created_at',
    order: table.order,
  });

  const [tableData, setTableData] = useState<EmailTemplate[]>([]);
  const [statusCounts, setStatusCounts] = useState({ all: 0, active: 0, inactive: 0 });

  // Fetch counts for all statuses to display in tabs
  const { templates: allTemplates } = useGetEmailTemplates({ per_page: 1000 });

  // Update status counts when all templates are fetched
  React.useEffect(() => {
    if (allTemplates) {
      const active = allTemplates.filter((item: any) => item.status === 'active').length;
      const inactive = allTemplates.filter((item: any) => item.status === 'inactive').length;
      setStatusCounts({
        all: allTemplates.length,
        active,
        inactive,
      });
    }
  }, [allTemplates]);

  // Update table data when templates are fetched
  React.useEffect(() => {
    if (templates) {
      setTableData(templates);
    }
  }, [templates]);

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
        await deleteEmailTemplate(id);
        toast.success(t('dashboard.emailTemplate.toast.deleteSuccess'));
        refetch();
      } catch (err) {
        console.error('Failed to delete email template:', err);
        toast.error(t('dashboard.emailTemplate.toast.deleteError'));
      }
    },
    [refetch, t]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => deleteEmailTemplate(id)));
      toast.success(t('dashboard.emailTemplate.toast.deleteMultipleSuccess'));
      refetch();
      table.onSelectAllRows(false, []);
    } catch (err) {
      console.error('Failed to delete email templates:', err);
      toast.error(t('dashboard.emailTemplate.toast.deleteMultipleError'));
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
      title={t('dashboard.emailTemplate.confirmDialog.deleteTitle')}
      content={
        <>
          {t('dashboard.emailTemplate.confirmDialog.deleteContent', {
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
          {t('dashboard.emailTemplate.menuActions.delete')}
        </Button>
      }
    />
  );

  return (
    <>
      <CustomBreadcrumbs
        heading={t('dashboard.emailTemplate.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.emailTemplate.heading'), href: paths.dashboard.emailTemplate.root },
          { name: t('dashboard.emailTemplate.list') },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.emailTemplate.create}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {t('dashboard.emailTemplate.addEmailTemplate')}
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
                    (tab.value === 'inactive' && 'warning') ||
                    'default'
                  }
                >
                  {tab.value === 'all'
                    ? statusCounts.all
                    : tab.value === 'active'
                      ? statusCounts.active
                      : statusCounts.inactive}
                </Label>
              }
            />
          ))}
        </Tabs>

        <EmailTemplateTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          statusOptions={STATUS_OPTIONS}
        />

        {canReset && (
          <EmailTemplateTableFiltersResult
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
              <Tooltip title={t('dashboard.emailTemplate.menuActions.delete')}>
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
                  <EmailTemplateTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    editHref={paths.dashboard.emailTemplate.edit(row.id)}
                    onConvertSuccess={refetch}
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

type ApplyFilterProps = {
  inputData: EmailTemplate[];
  filters: { name: string; status: string };
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
    inputData = inputData.filter((template) =>
      template.name?.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (status && status !== 'all') {
    inputData = inputData.filter((template) => template.status === status);
  }

  return inputData;
}

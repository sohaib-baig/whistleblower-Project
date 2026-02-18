import type { TableHeadCellProps } from 'src/components/table';
import type { IQuestion, IQuestionTableFilters } from 'src/types/question';

import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { deleteQuestion, useGetQuestions, reorderQuestions } from 'src/actions/question';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  getComparator,
  TableHeadCustom,
  TableSelectedAction,
} from 'src/components/table';

import { QUESTION_INPUT_TYPES } from 'src/types/question';

import { QuestionTableRow } from './question-table-row';
import QuestionNewEditForm from './question-new-edit-form';
import { QuestionTableToolbar } from './question-table-toolbar';
import { QuestionTableFiltersResult } from './question-table-filters-result';

// ----------------------------------------------------------------------

export default function QuestionListView() {
  const { t } = useTranslate('navbar');
  const table = useTable({ defaultOrderBy: 'order' });

  const TABLE_HEAD: TableHeadCellProps[] = [
    { id: 'name', label: t('dashboard.question.tableHeaders.questionName'), width: 300 },
    { id: 'isRequired', label: t('dashboard.question.tableHeaders.isRequired'), width: 120 },
    { id: 'inputType', label: t('dashboard.question.tableHeaders.inputType'), width: 120 },
    { id: '', width: 88 },
  ];

  const confirmDialog = useBoolean();
  const confirmDeleteDialog = useBoolean();
  const openNew = useBoolean();
  const openEdit = useBoolean();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<IQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const filters = useSetState<IQuestionTableFilters>({ name: '', inputType: '' });
  const { state: currentFilters } = filters;

  // Fetch questions from API
  const { questions, loading, error, refetch } = useGetQuestions();
  const [tableData, setTableData] = useState<IQuestion[]>([]);

  // Update table data when questions are fetched
  useEffect(() => {
    if (questions) {
      setTableData(questions);
    }
  }, [questions]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const canReset = !!currentFilters.name || !!currentFilters.inputType;

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const reorderByIds = useCallback((list: IQuestion[], sourceId: string, targetId: string) => {
    if (sourceId === targetId) return list;
    const updated = [...list];
    const sourceIndex = updated.findIndex((item) => item.id === sourceId);
    const targetIndex = updated.findIndex((item) => item.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return list;
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    // normalize order values after reinsert
    return updated.map((item, idx) => ({ ...item, order: idx + 1 }));
  }, []);

  const handleDragStart = useCallback(
    (id: string) => {
      // Switch to manual order view so reordering is visible immediately
      table.setOrderBy('order');
      table.setOrder('asc');
      setDraggingId(id);
    },
    [table]
  );

  const handleDragOverRow = useCallback(
    (overId: string) => {
      if (!draggingId || draggingId === overId) return;
      setTableData((prev) => reorderByIds(prev, draggingId, overId));
    },
    [draggingId, reorderByIds]
  );

  const handleDragEnd = useCallback(async () => {
    if (draggingId) {
      try {
        // Send new order to backend
        const questionsOrder = tableData.map((q, index) => ({
          id: q.id,
          order: index + 1,
        }));

        await reorderQuestions(questionsOrder);
        toast.success(t('dashboard.question.questionsReordered'));
        refetch(); // Refresh to get latest from server
      } catch (err) {
        console.error('Failed to save question order:', err);
        toast.error(t('dashboard.question.failedToReorder'));
        refetch(); // Revert to server state
      }
    }
    setDraggingId(null);
  }, [draggingId, tableData, refetch, t]);

  const handleDeleteRow = useCallback(
    (id: string) => {
      setQuestionToDelete(id);
      confirmDeleteDialog.onTrue();
    },
    [confirmDeleteDialog]
  );

  const confirmDeleteQuestion = useCallback(
    async () => {
      if (!questionToDelete) return;
      
      try {
        await deleteQuestion(questionToDelete);
        toast.success(t('dashboard.question.questionDeleted'));
        refetch(); // Refresh the list
        confirmDeleteDialog.onFalse();
        setQuestionToDelete(null);
      } catch (err) {
        console.error('Failed to delete question:', err);
        toast.error(t('dashboard.question.failedToDelete'));
        confirmDeleteDialog.onFalse();
        setQuestionToDelete(null);
      }
    },
    [questionToDelete, refetch, t, confirmDeleteDialog]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(table.selected.map((id) => deleteQuestion(id)));
      toast.success(t('dashboard.question.questionsDeleted'));
      table.onSelectAllRows(false, []);
      refetch(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete questions:', err);
      toast.error(t('dashboard.question.failedToDeletePlural'));
    }
  }, [table, refetch, t]);

  const handleEditQuestion = useCallback(
    (question: IQuestion) => {
      setSelectedQuestion(question);
      openEdit.onTrue();
    },
    [openEdit]
  );

  const handleNewQuestion = useCallback(() => {
    setSelectedQuestion(null);
    openNew.onTrue();
  }, [openNew]);

  const handleSaveQuestion = useCallback(() => {
    // Form handles API calls, just close dialogs and refresh
    openEdit.onFalse();
    openNew.onFalse();
    setSelectedQuestion(null);
    refetch();
  }, [openEdit, openNew, refetch]);

  const renderConfirmDialog = () => {
    const message = t('dashboard.question.deleteConfirmMessage');
    const formattedMessage = message.split('\n\n').map((paragraph, index) => (
      <Typography key={index} sx={{ mb: index < message.split('\n\n').length - 1 ? 2 : 0 }}>
        {paragraph}
      </Typography>
    ));

    return (
      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title={t('dashboard.question.deleteConfirmTitle')}
        content={<Box>{formattedMessage}</Box>}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirmDialog.onFalse();
            }}
          >
            {t('dashboard.question.delete')}
          </Button>
        }
      />
    );
  };

  const renderDeleteConfirmDialog = () => {
    const message = t('dashboard.question.deleteConfirmMessageSingle');
    const formattedMessage = message.split('\n\n').map((paragraph, index) => (
      <Typography key={index} sx={{ mb: index < message.split('\n\n').length - 1 ? 2 : 0 }}>
        {paragraph}
      </Typography>
    ));

    return (
      <ConfirmDialog
        open={confirmDeleteDialog.value}
        onClose={() => {
          confirmDeleteDialog.onFalse();
          setQuestionToDelete(null);
        }}
        title={t('dashboard.question.deleteConfirmTitle')}
        content={<Box>{formattedMessage}</Box>}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteQuestion}
          >
            {t('dashboard.question.delete')}
          </Button>
        }
      />
    );
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <CustomBreadcrumbs
          heading={t('dashboard.question.heading')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.question.heading'), href: paths.dashboard.question.root },
            { name: t('dashboard.question.list') },
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
          heading={t('dashboard.question.heading')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.question.heading'), href: paths.dashboard.question.root },
            { name: t('dashboard.question.list') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ color: 'error.main', mb: 2 }}>
            <Iconify icon="solar:danger-bold" width={48} />
          </Box>
          <Box sx={{ typography: 'h6', mb: 1 }}>{t('dashboard.question.errorLoading')}</Box>
          <Box sx={{ typography: 'body2', color: 'text.secondary', mb: 2 }}>{error}</Box>
          <Button variant="contained" onClick={refetch}>
            {t('dashboard.question.retry')}
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <CustomBreadcrumbs
        heading={t('dashboard.question.heading')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.question.heading'), href: paths.dashboard.question.root },
          { name: t('dashboard.question.list') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleNewQuestion}
          >
            {t('dashboard.question.addQuestion')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        {/* <Tabs
          value={currentFilters.inputType || 'all'}
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
                    ((tab.value === 'all' || tab.value === currentFilters.inputType) && 'filled') ||
                    'soft'
                  }
                  color={
                    (tab.value === 'text' && 'primary') ||
                    (tab.value === 'select' && 'secondary') ||
                    (tab.value === 'required' && 'error') ||
                    'default'
                  }
                >
                  {tab.value === 'all'
                    ? tableData.length
                    : tab.value === 'required'
                    ? tableData.filter((question) => question.isRequired).length
                    : tableData.filter((question) => question.inputType === tab.value).length}
                </Label>
              }
            />
          ))}
        </Tabs> */}

        <QuestionTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          inputTypeOptions={QUESTION_INPUT_TYPES}
        />

        {canReset && (
          <QuestionTableFiltersResult
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
              <Tooltip title={t('dashboard.question.delete')}>
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
                  <QuestionTableRow
                    key={row.id}
                    row={row}
                    selected={table.selected.includes(row.id)}
                    onSelectRow={() => table.onSelectRow(row.id)}
                    onDeleteRow={() => handleDeleteRow(row.id)}
                    onEditRow={() => handleEditQuestion(row)}
                    onDragStart={handleDragStart}
                    onDragOverRow={handleDragOverRow}
                    onDragEnd={handleDragEnd}
                    dragging={draggingId === row.id}
                  />
                ))}

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>
      </Card>

      <QuestionNewEditForm
        open={openNew.value}
        onClose={openNew.onFalse}
        onSave={handleSaveQuestion}
        question={null}
      />

      <QuestionNewEditForm
        open={openEdit.value}
        onClose={openEdit.onFalse}
        onSave={handleSaveQuestion}
        question={selectedQuestion}
      />

      {renderConfirmDialog()}
      {renderDeleteConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

type ApplyFilterProps = {
  inputData: IQuestion[];
  filters: IQuestionTableFilters;
  comparator: (a: any, b: any) => number;
};

function applyFilter({ inputData, comparator, filters }: ApplyFilterProps) {
  const { name, inputType } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name && typeof name === 'string') {
    inputData = inputData.filter((question) =>
      question.name?.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (inputType) {
    if (inputType === 'required') {
      inputData = inputData.filter((question) => question.isRequired);
    } else {
      inputData = inputData.filter((question) => question.inputType === inputType);
    }
  }

  return inputData;
}

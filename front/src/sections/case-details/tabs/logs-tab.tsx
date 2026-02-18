import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import { getCaseLogs, type CaseLogEntry } from 'src/actions/company-case-details';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

type Props = {
  caseId: string;
};

export default function LogsTab({ caseId }: Props) {
  const { t } = useTranslate('navbar');
  const [logs, setLogs] = useState<CaseLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const TABLE_HEAD = [
    { id: 'actionPerformed', label: t('dashboard.case.logsTab.actionPerformed') },
    { id: 'actionValue', label: t('dashboard.case.logsTab.actionValue') },
    { id: 'dateTime', label: t('dashboard.case.logsTab.dateTime') },
  ];

  // Fetch logs from API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await getCaseLogs(caseId);
        setLogs(data);
      } catch (err: any) {
        console.error('Error fetching logs:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchLogs();
    }
  }, [caseId]);

  const filteredLogs = logs.filter(
    (log) =>
      (log.action_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action_value || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Card>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
        >
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6">{t('dashboard.case.logsTab.heading')}</Typography>

          <TextField
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('dashboard.case.logsTab.searchPlaceholder')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Stack>

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="text.secondary">
                        {logs.length === 0
                          ? t('dashboard.case.logsTab.noLogsFound')
                          : t('dashboard.case.logsTab.noLogsMatchSearch')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell>{log.action_type}</TableCell>
                        <TableCell>{log.action_value || '-'}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={page}
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Card>
  );
}

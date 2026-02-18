import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import Snackbar from '@mui/material/Snackbar';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  addNote,
  deleteNote,
  updateNote,
  getCaseNotes,
  createCaseLog,
  type CaseNote,
} from 'src/actions/company-case-details';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

interface CompanyNotesTabProps {
  caseId: string;
  userId: string;
  companySlug: string;
}

// ----------------------------------------------------------------------

export function CompanyNotesTab({ caseId, userId, companySlug }: CompanyNotesTabProps) {
  const { t } = useTranslate('navbar');
  const { i18n } = useTranslation();

  const TABLE_HEAD = [
    { id: 'title', label: t('dashboard.case.notesTab.title', 'Title') },
    { id: 'description', label: t('dashboard.case.notesTab.description', 'Description') },
    { id: 'date', label: t('dashboard.case.notesTab.date', 'Date') },
    { id: 'addedBy', label: t('dashboard.case.notesTab.addedBy', 'Added By') },
    { id: 'actions', label: t('dashboard.case.notesTab.actions', 'Actions') },
  ];
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<CaseNote | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const data = await getCaseNotes(caseId);
        setNotes(data);

        // Log tab view
        try {
          await createCaseLog(caseId, 'Tab Viewed', 'Notes Tab');
        } catch (logError) {
          console.error('Failed to log tab view:', logError);
        }
      } catch (err: any) {
        console.error('Error fetching notes:', err);
        setSnackbarMessage(err.message || 'Failed to load notes');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchNotes();
    }
  }, [caseId, i18n.language]);

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setEditingNote(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    // Don't close dialog if we're saving
    if (saving) return;

    setOpenDialog(false);
    setNoteTitle('');
    setNoteDescription('');
    setEditingNote(null);
  };

  const handleSubmitNote = async () => {
    // Client-side validation
    const trimmedTitle = noteTitle.trim();
    const trimmedDescription = noteDescription.trim();

    if (!trimmedTitle) {
      setSnackbarMessage(
        t('dashboard.case.notesTab.pleaseEnterNoteTitle', 'Please enter a note title')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!trimmedDescription) {
      setSnackbarMessage(
        t('dashboard.case.notesTab.pleaseEnterNoteDescription', 'Please enter a note description')
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setSaving(true);

      if (editingNote) {
        // Update existing note
        const updatedNote = await updateNote(editingNote.id, trimmedTitle, trimmedDescription);
        setNotes((prev) => prev.map((note) => (note.id === editingNote.id ? updatedNote : note)));

        // Log the action
        try {
          await createCaseLog(caseId, 'Note Updated', `Note: ${trimmedTitle}`);
        } catch (logError) {
          console.error('Failed to log note update:', logError);
        }

        setSnackbarMessage(
          t('dashboard.case.notesTab.updatedSuccessfully', 'Note updated successfully')
        );
      } else {
        // Add new note
        const newNote = await addNote(
          caseId,
          userId,
          companySlug,
          trimmedTitle,
          trimmedDescription
        );
        setNotes((prev) => [newNote, ...prev]);

        // Log the action
        try {
          await createCaseLog(caseId, 'Note Created', `Note: ${trimmedTitle}`);
        } catch (logError) {
          console.error('Failed to log note creation:', logError);
        }

        setSnackbarMessage(
          t('dashboard.case.notesTab.addedSuccessfully', 'Note added successfully')
        );
      }

      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog();
    } catch (err: any) {
      console.error('Submit error:', err);
      setSnackbarMessage(err.message || 'Failed to save note');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleEditNote = (id: string) => {
    const foundNote = notes.find((note) => note.id === id);
    if (foundNote) {
      setEditingNote(foundNote);
      setNoteTitle(foundNote.title);
      setNoteDescription(foundNote.description);
      setOpenDialog(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      try {
        const noteToDeleteObj = notes.find((note) => note.id === noteToDelete);
        await deleteNote(noteToDelete);
        setNotes((prev) => prev.filter((note) => note.id !== noteToDelete));

        // Log the action
        try {
          await createCaseLog(
            caseId,
            'Note Deleted',
            noteToDeleteObj ? `Note: ${noteToDeleteObj.title}` : `Note ID: ${noteToDelete}`
          );
        } catch (logError) {
          console.error('Failed to log note delete:', logError);
        }

        setSnackbarMessage(
          t('dashboard.case.notesTab.deletedSuccessfully', 'Note deleted successfully')
        );
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (err: any) {
        setSnackbarMessage(
          err.message || t('dashboard.case.notesTab.failedToDelete', 'Failed to delete note')
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    setDeleteConfirmOpen(false);
    setNoteToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6">{t('dashboard.case.notesTab.heading', 'Notes')}</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('dashboard.case.notesTab.searchPlaceholder', 'Search notes...')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={handleOpenDialog}
            >
              {t('dashboard.case.notesTab.addNote', 'Add Note')}
            </Button>
          </Stack>
        </Stack>

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {filteredNotes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((note) => (
                    <TableRow key={note.id} hover>
                      <TableCell>{note.title}</TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" noWrap>
                          {note.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(note.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {note.creator?.name ||
                          t('dashboard.case.notesTab.unknownUser', 'Unknown User')}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => handleEditNote(note.id)}>
                            <Iconify icon="solar:pen-bold" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteNote(note.id)}
                            color="error"
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          page={page}
          count={filteredNotes.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Box>

      <Dialog open={openDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingNote
            ? t('dashboard.case.notesTab.editNote', 'Edit Note')
            : t('dashboard.case.notesTab.addNewNote', 'Add New Note')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('dashboard.case.notesTab.noteTitle', 'Note Title')}
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />

            <TextField
              fullWidth
              label={t('dashboard.case.notesTab.description', 'Description')}
              multiline
              rows={4}
              value={noteDescription}
              onChange={(e) => setNoteDescription(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            {t('dashboard.case.reportSettingTab.cancel', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={handleSubmitNote} disabled={saving}>
            {saving
              ? t('dashboard.case.notesTab.saving', 'Saving...')
              : editingNote
                ? t('dashboard.case.notesTab.save', 'Save')
                : t('dashboard.case.notesTab.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('dashboard.case.notesTab.deleteConfirmTitle', 'Delete Note')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t(
              'dashboard.case.notesTab.deleteConfirmMessage',
              'Are you sure you want to delete this note? This action cannot be undone.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t('dashboard.case.reportSettingTab.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('dashboard.case.notesTab.delete', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

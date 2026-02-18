import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';
import {
  type CaseNote,
  createCaseLog,
  addNoteAuthenticated,
  deleteNoteAuthenticated,
  updateNoteAuthenticated,
  getCaseNotesAuthenticated,
} from 'src/actions/company-case-details';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

type Props = {
  caseId: string;
};

export default function NotesTab({ caseId }: Props) {
  const { t } = useTranslate('navbar');
  const [searchTerm, setSearchTerm] = useState('');

  const TABLE_HEAD = [
    { id: 'title', label: t('dashboard.case.notesTab.title') },
    { id: 'description', label: t('dashboard.case.notesTab.description') },
    { id: 'date', label: t('dashboard.case.notesTab.date') },
    { id: 'addedBy', label: t('dashboard.case.notesTab.addedBy') },
    { id: 'actions', label: t('dashboard.case.notesTab.actions') },
  ];
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

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const data = await getCaseNotesAuthenticated(caseId);
        setNotes(Array.isArray(data) ? data : []);

        // Log tab view
        try {
          await createCaseLog(caseId, 'Tab Viewed', 'Notes Tab (Backend)');
        } catch (logError) {
          console.error('Failed to log tab view:', logError);
        }
      } catch (err: any) {
        console.error('Error fetching notes:', err);
        toast.error(err.message || t('dashboard.case.notesTab.failedToLoad'));
        setNotes([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchNotes();
    }
  }, [caseId, t]);

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
      toast.error(t('dashboard.case.notesTab.pleaseEnterNoteTitle'));
      return;
    }

    if (!trimmedDescription) {
      toast.error(t('dashboard.case.notesTab.pleaseEnterNoteDescription'));
      return;
    }

    try {
      setSaving(true);

      if (editingNote) {
        // Update existing note
        const updatedNote = await updateNoteAuthenticated(
          editingNote.id,
          trimmedTitle,
          trimmedDescription
        );
        setNotes((prev) => prev.map((note) => (note.id === editingNote.id ? updatedNote : note)));

        // Log the action
        try {
          await createCaseLog(caseId, 'Note Updated', `Note: ${trimmedTitle}`);
        } catch (logError) {
          console.error('Failed to log note update:', logError);
        }

        toast.success(t('dashboard.case.notesTab.updatedSuccessfully'));
      } else {
        // Add new note
        const newNote = await addNoteAuthenticated(caseId, trimmedTitle, trimmedDescription);
        setNotes((prev) => [newNote, ...prev]);

        // Log the action
        try {
          await createCaseLog(caseId, 'Note Created', `Note: ${trimmedTitle}`);
        } catch (logError) {
          console.error('Failed to log note creation:', logError);
        }

        toast.success(t('dashboard.case.notesTab.addedSuccessfully'));
      }

      handleCloseDialog();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || t('dashboard.case.notesTab.failedToSave'));
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
        await deleteNoteAuthenticated(noteToDelete);
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

        toast.success(t('dashboard.case.notesTab.deletedSuccessfully'));
      } catch (err: any) {
        toast.error(err.message || t('dashboard.case.notesTab.failedToDelete'));
      }
    }
    setDeleteConfirmOpen(false);
    setNoteToDelete(null);
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
      <Card>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">{t('dashboard.case.notesTab.heading')}</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('dashboard.case.notesTab.searchPlaceholder')}
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
                {t('dashboard.case.notesTab.addNote')}
              </Button>
            </Stack>
          </Stack>

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Scrollbar>
              <Table>
                <TableHeadCustom headCells={TABLE_HEAD} />
                <TableBody>
                  {filteredNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {searchTerm
                            ? t('dashboard.case.notesTab.noNotesMatchSearch')
                            : t('dashboard.case.notesTab.noNotesFound')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotes
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((note) => (
                        <TableRow key={note.id} hover>
                          <TableCell>{note.title}</TableCell>
                          <TableCell sx={{ maxWidth: 300 }}>
                            <Typography variant="body2" noWrap>
                              {note.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {note.created_at
                              ? new Date(note.created_at).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {note.creator?.name || t('dashboard.case.notesTab.unknownUser')}
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
                      ))
                  )}
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
      </Card>

      {/* Add/Edit Note Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingNote
            ? t('dashboard.case.notesTab.editNote')
            : t('dashboard.case.notesTab.addNewNote')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('dashboard.case.notesTab.noteTitle')}
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              error={!noteTitle.trim() && saving}
              helperText={
                !noteTitle.trim() && saving ? t('dashboard.case.notesTab.noteTitleRequired') : ''
              }
            />

            <TextField
              fullWidth
              label={t('dashboard.case.notesTab.description')}
              multiline
              rows={4}
              value={noteDescription}
              onChange={(e) => setNoteDescription(e.target.value)}
              error={!noteDescription.trim() && saving}
              helperText={
                !noteDescription.trim() && saving
                  ? t('dashboard.case.notesTab.descriptionRequired')
                  : ''
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            {t('dashboard.case.notesTab.cancel')}
          </Button>
          <Button variant="contained" onClick={handleSubmitNote} disabled={saving}>
            {saving ? t('dashboard.case.notesTab.saving') : t('dashboard.case.notesTab.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('dashboard.case.notesTab.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('dashboard.case.notesTab.deleteConfirmMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t('dashboard.case.notesTab.cancel')}
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('dashboard.case.notesTab.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

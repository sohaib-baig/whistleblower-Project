import { z as zod } from 'zod';
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
import { CONFIG } from 'src/global-config';
import { createCaseLog } from 'src/actions/company-case-details';
import {
  getCaseAttachments,
  type CaseAttachment,
  uploadCaseAttachment,
} from 'src/actions/company-landing';

import { Upload } from 'src/components/upload';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

const documentSchema = zod.object({
  attachment_name: zod
    .string()
    .min(1, 'Document name is required')
    .max(255, 'Document name must not exceed 255 characters'),
  file: zod
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must not exceed 10MB')
    .refine((file) => {
      const allowedTypes = [
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'ppt',
        'pptx',
        'txt',
        'jpg',
        'jpeg',
        'png',
        'gif',
      ];
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension && allowedTypes.includes(extension);
    }, 'Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF'),
});

// ----------------------------------------------------------------------

interface CompanyDocumentsTabProps {
  caseId: string;
  userId: string;
  companySlug: string;
}

// ----------------------------------------------------------------------

export function CompanyDocumentsTab({ caseId, userId, companySlug }: CompanyDocumentsTabProps) {
  const { t } = useTranslate('navbar');
  const { i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<CaseAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [errors, setErrors] = useState<{ attachment_name?: string; file?: string }>({});

  const TABLE_HEAD = [
    { id: 'title', label: t('dashboard.case.documentsTab.title', 'Title') },
    { id: 'document', label: t('dashboard.case.documentsTab.document', 'Document') },
    { id: 'uploadedAt', label: t('dashboard.case.documentsTab.uploadedAt', 'Uploaded At') },
    { id: 'actions', label: t('dashboard.case.documentsTab.actions', 'Actions') },
  ];

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        setLoading(true);
        const data = await getCaseAttachments(caseId);
        setDocuments(data);

        // Log tab view
        try {
          await createCaseLog(caseId, 'Tab Viewed', 'Documents Tab');
        } catch (logError) {
          console.error('Failed to log tab view:', logError);
        }
      } catch (err: any) {
        console.error('Error fetching attachments:', err);
        setSnackbarMessage(err.message || 'Failed to load documents');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchAttachments();
    }
  }, [caseId, i18n.language]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDocumentTitle('');
    setDocumentFile(null);
    setErrors({});
  };

  const handleSubmitDocument = async () => {
    // Reset errors
    setErrors({});

    // Client-side validation
    if (!documentTitle.trim()) {
      setErrors({ attachment_name: 'Document name is required' });
      setSnackbarMessage('Please enter a document name');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (!documentFile) {
      setErrors({ file: 'File is required' });
      setSnackbarMessage('Please select a file to upload');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Validate file size (10MB max)
    if (documentFile.size > 10 * 1024 * 1024) {
      setErrors({ file: 'File size must not exceed 10MB' });
      setSnackbarMessage('File size must not exceed 10MB');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'jpg',
      'jpeg',
      'png',
      'gif',
    ];
    const extension = documentFile.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      setErrors({
        file: 'Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF',
      });
      setSnackbarMessage('Invalid file type');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Validate using Zod schema
    try {
      documentSchema.parse({
        attachment_name: documentTitle,
        file: documentFile,
      });

      // Upload document
      setUploading(true);
      await uploadCaseAttachment(caseId, documentFile, documentTitle);

      // Log the action
      try {
        await createCaseLog(
          caseId,
          'Document Uploaded',
          `Document: ${documentTitle} (${documentFile.name})`
        );
      } catch (logError) {
        console.error('Failed to log document upload:', logError);
      }

      // Refresh documents list
      const updatedAttachments = await getCaseAttachments(caseId);
      setDocuments(updatedAttachments);

      setSnackbarMessage('Document uploaded successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog();
    } catch (err: any) {
      if (err.errors) {
        // Zod validation errors
        const zodErrors: { attachment_name?: string; file?: string } = {};
        err.errors.forEach((error: any) => {
          if (error.path[0] === 'attachment_name') {
            zodErrors.attachment_name = error.message;
          } else if (error.path[0] === 'file') {
            zodErrors.file = error.message;
          }
        });
        setErrors(zodErrors);
      }

      setSnackbarMessage(err.message || 'Failed to upload document');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDocument = (attachment: CaseAttachment) => {
    const fileUrl = attachment.attachment_path.startsWith('http')
      ? attachment.attachment_path
      : `${CONFIG.serverUrl}${attachment.attachment_path}`;
    window.open(fileUrl, '_blank');
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

  const filteredDocuments = documents.filter((doc) =>
    doc.attachment_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h6">
            {t('dashboard.case.documentsTab.heading', 'Documents')}
          </Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                'dashboard.case.documentsTab.searchPlaceholder',
                'Search documents...'
              )}
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
              {t('dashboard.case.documentsTab.newDocument', 'New Document')}
            </Button>
          </Stack>
        </Stack>

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table>
              <TableHeadCustom headCells={TABLE_HEAD} />
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        {t('dashboard.case.documentsTab.noDocumentsFound', 'No documents found')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>{doc.attachment_name}</TableCell>
                        <TableCell>
                          <Button
                            variant="text"
                            startIcon={<Iconify icon="solar:download-bold" />}
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            {doc.attachment_name}.{doc.attachment_type}
                          </Button>
                        </TableCell>
                        <TableCell>{doc.created_at}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" onClick={() => handleDownloadDocument(doc)}>
                              <Iconify icon="solar:download-bold" />
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
          count={filteredDocuments.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('dashboard.case.documentsTab.uploadNewDocument', 'Upload New Document')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t('dashboard.case.documentsTab.documentTitle', 'Document Name')}
              value={documentTitle}
              onChange={(e) => {
                setDocumentTitle(e.target.value);
                if (errors.attachment_name) {
                  setErrors({ ...errors, attachment_name: undefined });
                }
              }}
              error={!!errors.attachment_name}
              helperText={errors.attachment_name}
              required
            />

            <Box>
              <Upload
                value={documentFile}
                onDrop={(files) => {
                  setDocumentFile(files[0]);
                  if (errors.file) {
                    setErrors({ ...errors, file: undefined });
                  }
                }}
                onDelete={() => {
                  setDocumentFile(null);
                  if (errors.file) {
                    setErrors({ ...errors, file: undefined });
                  }
                }}
              />
              {errors.file && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {errors.file}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploading}>
            {t('dashboard.case.reportSettingTab.cancel', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={handleSubmitDocument} disabled={uploading}>
            {uploading
              ? t('dashboard.case.documentsTab.uploading', 'Uploading...')
              : t('dashboard.case.documentsTab.upload', 'Upload')}
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

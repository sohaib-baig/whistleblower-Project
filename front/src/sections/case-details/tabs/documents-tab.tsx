import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
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
  createCaseLog,
  getCaseAttachments,
  type CaseAttachment,
  deleteCaseAttachment,
  uploadCaseAttachment,
} from 'src/actions/company-case-details';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom, TablePaginationCustom } from 'src/components/table';

// ----------------------------------------------------------------------

type Props = {
  caseId: string;
};

export default function DocumentsTab({ caseId }: Props) {
  const { t } = useTranslate('navbar');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<CaseAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ file?: string }>({});

  const TABLE_HEAD = [
    { id: 'title', label: t('dashboard.case.documentsTab.title') },
    { id: 'document', label: t('dashboard.case.documentsTab.document') },
    { id: 'uploadedAt', label: t('dashboard.case.documentsTab.uploadedAt') },
    { id: 'actions', label: t('dashboard.case.documentsTab.actions') },
  ];

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        setLoading(true);
        const data = await getCaseAttachments(caseId);
        setDocuments(data);

        // Log tab view
        try {
          await createCaseLog(caseId, 'Tab Viewed', 'Documents Tab (Backend)');
        } catch (logError) {
          console.error('Failed to log tab view:', logError);
        }
      } catch (err: any) {
        console.error('Error fetching attachments:', err);
        toast.error(err.message || t('dashboard.case.documentsTab.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    if (caseId) {
      fetchAttachments();
    }
  }, [caseId, t]);

  const filteredDocuments = documents.filter((doc) =>
    doc.attachment_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (uploading) return;
    setOpenDialog(false);
    setDocumentFiles([]);
    setErrors({});
  };

  const handleSubmitDocument = async () => {
    // Reset errors
    setErrors({});

    // Client-side validation
    if (documentFiles.length === 0) {
      setErrors({ file: t('dashboard.case.documentsTab.fileRequired') });
      toast.error(t('dashboard.case.documentsTab.pleaseSelectFile'));
      return;
    }

    // Validate all files
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

    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];

    documentFiles.forEach((file) => {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        oversizedFiles.push(file.name);
      }

      // Validate file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedTypes.includes(extension)) {
        invalidFiles.push(file.name);
      }
    });

    if (oversizedFiles.length > 0) {
      setErrors({ file: t('dashboard.case.documentsTab.fileSizeExceeded') });
      toast.error(
        `${t('dashboard.case.documentsTab.fileSizeMaxExceeded')}: ${oversizedFiles.join(', ')}`
      );
      return;
    }

    if (invalidFiles.length > 0) {
      setErrors({ file: t('dashboard.case.documentsTab.invalidFileType') });
      toast.error(
        `${t('dashboard.case.documentsTab.invalidFileTypeError')}: ${invalidFiles.join(', ')}`
      );
      return;
    }

    // Upload all documents
    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of documentFiles) {
        try {
          // Use file name (without extension) as document title
          const fileName = file.name;
          const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
          const documentTitle = nameWithoutExt.trim() || fileName;

          await uploadCaseAttachment(caseId, file, documentTitle);

          // Log the action
          try {
            await createCaseLog(
              caseId,
              'Document Uploaded',
              `Document: ${documentTitle} (${file.name})`
            );
          } catch (logError) {
            console.error('Failed to log document upload:', logError);
          }

          successCount++;
        } catch (err: any) {
          console.error(`Failed to upload ${file.name}:`, err);
          failCount++;
        }
      }

      // Refresh documents list
      const updatedAttachments = await getCaseAttachments(caseId);
      setDocuments(updatedAttachments);

      if (successCount > 0) {
        toast.success(
          `${successCount} ${successCount === 1 ? 'document' : 'documents'} uploaded successfully`
        );
      }
      if (failCount > 0) {
        toast.error(`${failCount} ${failCount === 1 ? 'document' : 'documents'} failed to upload`);
      }

      if (successCount > 0) {
        handleCloseDialog();
      }
    } catch (err: any) {
      toast.error(err.message || t('dashboard.case.documentsTab.failedToUpload'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocumentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (documentToDelete) {
      try {
        const documentToDeleteObj = documents.find((doc) => doc.id === documentToDelete);
        await deleteCaseAttachment(documentToDelete);

        // Log the action
        try {
          await createCaseLog(
            caseId,
            'Document Deleted',
            documentToDeleteObj
              ? `Document: ${documentToDeleteObj.attachment_name}`
              : `Document ID: ${documentToDelete}`
          );
        } catch (logError) {
          console.error('Failed to log document delete:', logError);
        }

        // Refresh documents list
        const updatedAttachments = await getCaseAttachments(caseId);
        setDocuments(updatedAttachments);

        toast.success(t('dashboard.case.documentsTab.deletedSuccessfully'));
      } catch (err: any) {
        toast.error(err.message || t('dashboard.case.documentsTab.failedToDelete'));
      }
    }
    setDeleteConfirmOpen(false);
    setDocumentToDelete(null);
  };

  const handleDownloadDocument = (attachment: CaseAttachment) => {
    window.open(attachment.attachment_path, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">{t('dashboard.case.documentsTab.heading')}</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('dashboard.case.documentsTab.searchPlaceholder')}
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
                {t('dashboard.case.documentsTab.newDocument')}
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
                        <Typography variant="body2" color="text.secondary">
                          {documents.length === 0
                            ? t('dashboard.case.documentsTab.noDocumentsFound')
                            : t('dashboard.case.documentsTab.noDocumentsMatchSearch')}
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
                              {doc.attachment_type.toUpperCase()}{' '}
                              {t('dashboard.case.documentsTab.file')}
                            </Button>
                          </TableCell>
                          <TableCell>{doc.created_at || 'N/A'}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteDocument(doc.id)}
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
            count={filteredDocuments.length}
            rowsPerPage={rowsPerPage}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </Box>
      </Card>

      {/* Document Upload Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('dashboard.case.documentsTab.uploadNewDocument')}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('dashboard.case.documentsTab.selectMultipleFiles', 'Select one or more files to upload. File names will be used as document titles.')}
            </Typography>

            <Upload
              multiple
              accept={{
                'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-powerpoint': ['.ppt'],
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
                'text/plain': ['.txt'],
              }}
              value={documentFiles}
              onDrop={(files) => {
                setDocumentFiles(files);
                if (errors.file) {
                  setErrors({ ...errors, file: undefined });
                }
              }}
              onRemove={(file) => {
                setDocumentFiles((prev) => prev.filter((f) => f !== file));
              }}
              onRemoveAll={() => {
                setDocumentFiles([]);
                if (errors.file) {
                  setErrors({ ...errors, file: undefined });
                }
              }}
            />
            {errors.file && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errors.file}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploading}>
            {t('dashboard.case.documentsTab.close')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitDocument}
            disabled={uploading || documentFiles.length === 0}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading
              ? t('dashboard.case.documentsTab.uploading')
              : t('dashboard.case.documentsTab.upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('dashboard.case.documentsTab.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('dashboard.case.documentsTab.deleteConfirmMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t('dashboard.case.documentsTab.close')}
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('dashboard.case.documentsTab.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

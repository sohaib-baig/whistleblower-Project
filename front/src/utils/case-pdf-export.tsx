import React from 'react';
import JSZip from 'jszip';
import { pdf, Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';
import {
  type CaseNote,
  getCaseAttachments,
  type CaseAttachment,
  getCaseNotesAuthenticated,
} from 'src/actions/company-case-details';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  value: {
    fontSize: 11,
    marginBottom: 10,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #eee',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 5,
  },
});

// Case Details PDF Component
const CaseDetailsPDF = ({ caseData }: { caseData: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Case Details</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Case ID:</Text>
        <Text style={styles.value}>{caseData.case_id || caseData.id || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Title:</Text>
        <Text style={styles.value}>{caseData.title || caseData.subject || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{caseData.description || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Company:</Text>
        <Text style={styles.value}>{caseData.company?.name || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Category:</Text>
        <Text style={styles.value}>{caseData.category?.name || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{caseData.status || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Case Manager:</Text>
        <Text style={styles.value}>{caseData.case_manager?.name || 'Unassigned'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Created Date:</Text>
        <Text style={styles.value}>
          {caseData.created_at ? new Date(caseData.created_at).toLocaleString() : 'N/A'}
        </Text>
      </View>
    </Page>
  </Document>
);

// Report Settings PDF Component
const ReportSettingsPDF = ({ reportSettings }: { reportSettings: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Report Settings</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{reportSettings.status || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Assigned To:</Text>
        <Text style={styles.value}>{reportSettings.case_manager_name || 'Not Assigned'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Next Open State Deadline:</Text>
        <Text style={styles.value}>
          {reportSettings.open_deadline_time 
            ? new Date(reportSettings.open_deadline_time).toLocaleString() 
            : 'N/A'}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Next Close State Deadline:</Text>
        <Text style={styles.value}>
          {reportSettings.close_deadline_time 
            ? new Date(reportSettings.close_deadline_time).toLocaleString() 
            : 'N/A'}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Link with Other Report:</Text>
        <Text style={styles.value}>{reportSettings.other_report_link || 'N/A'}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Auto Delete After 30 Days:</Text>
        <Text style={styles.value}>{reportSettings.automatic_delete ? 'Yes' : 'No'}</Text>
      </View>
    </Page>
  </Document>
);

// Notes PDF Component
const NotesPDF = ({ notes }: { notes: CaseNote[] }) => {
  if (!notes || notes.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.value}>No notes available</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      {notes.map((note, index) => (
        <Page key={note.id} size="A4" style={styles.page}>
          {index === 0 && <Text style={styles.title}>Notes</Text>}
          <View style={styles.section}>
            <Text style={styles.label}>Note {index + 1}</Text>
            <Text style={styles.value}>
              <Text style={{ fontWeight: 'bold' }}>Title: </Text>
              {note.title || 'N/A'}
            </Text>
            <Text style={styles.value}>
              <Text style={{ fontWeight: 'bold' }}>Description: </Text>
              {note.description || 'N/A'}
            </Text>
            <Text style={styles.value}>
              <Text style={{ fontWeight: 'bold' }}>Date: </Text>
              {note.created_at ? new Date(note.created_at).toLocaleString() : 'N/A'}
            </Text>
            <Text style={styles.value}>
              <Text style={{ fontWeight: 'bold' }}>Added By: </Text>
              {note.creator?.name || 'Unknown'}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

// Documents PDF Component
const DocumentsPDF = ({ documents }: { documents: CaseAttachment[] }) => {
  if (!documents || documents.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Documents</Text>
          <Text style={styles.value}>No documents available</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Documents</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Document Name</Text>
            <Text style={styles.tableCell}>Type</Text>
            <Text style={styles.tableCell}>Uploaded At</Text>
          </View>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{doc.attachment_name || 'N/A'}</Text>
              <Text style={styles.tableCell}>{doc.attachment_type || 'N/A'}</Text>
              <Text style={styles.tableCell}>
                {doc.created_at ? new Date(doc.created_at).toLocaleString() : 'N/A'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

/**
 * Fetches report settings from API
 */
async function getReportSettings(caseId: string): Promise<any> {
  try {
    await initSanctumCsrf();
    const response = await sanctum.get(`/api/v1/cases/${caseId}/report-settings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report settings:', error);
    return null;
  }
}

/**
 * Generates PDF blob from React PDF document
 */
async function generatePDFBlob(doc: React.ReactElement<any>): Promise<Blob> {
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Downloads case data as separate PDFs in a zip file
 */
export async function downloadCaseAsPDFs(caseId: string, caseData: any): Promise<void> {
  try {
    // Show loading indicator
    const toast = (await import('src/components/snackbar')).toast;
    toast.info('Preparing case documents for download...');

    // Initialize CSRF token before making requests
    await initSanctumCsrf();

    // Fetch all data with proper error handling
    let notes: CaseNote[] = [];
    let documents: CaseAttachment[] = [];
    let reportSettings: any = null;

    try {
      const notesData = await getCaseNotesAuthenticated(caseId);
      notes = Array.isArray(notesData) ? notesData : [];
      if (notes.length === 0) {
        console.warn('No notes found for case:', caseId);
      }
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      console.error('Error details:', error.message, error.response?.data);
      // Don't show error toast, just log it
    }

    try {
      const documentsData = await getCaseAttachments(caseId);
      documents = Array.isArray(documentsData) ? documentsData : [];
      if (documents.length === 0) {
        console.warn('No documents found for case:', caseId);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      console.error('Error details:', error.message, error.response?.data);
      // Don't show error toast, just log it
    }

    try {
      reportSettings = await getReportSettings(caseId);
    } catch (error: any) {
      console.error('Error fetching report settings:', error);
      // Report settings are optional, so we continue
    }

    // Generate PDFs
    const pdfs = await Promise.all([
      generatePDFBlob(<CaseDetailsPDF caseData={caseData} />),
      generatePDFBlob(<ReportSettingsPDF reportSettings={reportSettings || {}} />),
      generatePDFBlob(<NotesPDF notes={notes} />),
      generatePDFBlob(<DocumentsPDF documents={documents} />),
    ]);

    // Create zip file
    const zip = new JSZip();
    zip.file('case-details.pdf', pdfs[0]);
    zip.file('report-settings.pdf', pdfs[1]);
    zip.file('notes.pdf', pdfs[2]);
    zip.file('documents.pdf', pdfs[3]);

    // Generate zip blob and download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `case-${caseId}-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Case documents downloaded successfully!');
  } catch (error) {
    console.error('Error downloading case PDFs:', error);
    const toast = (await import('src/components/snackbar')).toast;
    toast.error('Failed to download case documents. Please try again.');
    throw error;
  }
}

import { useMemo } from 'react';
import { useLocation } from 'react-router';

import { useParams } from 'src/routes/hooks';

import { decodeAndDecryptId } from 'src/utils/encryption';
import { getPasswordSession } from 'src/utils/password-session';

import { ChatProvider } from 'src/sections/company/case-details/chat-context';
import { CompanyChatTab } from 'src/sections/company/case-details/tabs/company-chat-tab';
import { CompanyLogsTab } from 'src/sections/company/case-details/tabs/company-logs-tab';
import { CompanyNotesTab } from 'src/sections/company/case-details/tabs/company-notes-tab';
import { CompanyDocumentsTab } from 'src/sections/company/case-details/tabs/company-documents-tab';
import { CompanyCaseDetailsTab } from 'src/sections/company/case-details/tabs/company-case-details-tab';
import { CompanyCaseDetailsLayout } from 'src/sections/company/case-details/company-case-details-layout';
import { CompanyReportSettingTab } from 'src/sections/company/case-details/tabs/company-report-setting-tab';

import { PasswordGuard } from 'src/auth/guard/password-guard';

// ----------------------------------------------------------------------

export default function CompanyCaseDetailsPage() {
  const { slug } = useParams();
  const location = useLocation();

  // Parse the pathname to extract encrypted IDs and tab
  // Handle both encoded and unencoded URLs

  // Extract the full path after 'case-details' and split it properly
  const fullPath = location.pathname.substring(
    location.pathname.indexOf('/case-details/') + '/case-details/'.length
  );
  const pathParts = fullPath.split('/');

  // Handle both encoded and unencoded IDs
  let encryptedUserId = pathParts[0] || '';
  let encryptedCaseId = pathParts[1] || '';
  const tab = pathParts[2] || '';

  // If the IDs contain encoded characters, decode them
  if (encryptedUserId.includes('%')) {
    encryptedUserId = decodeURIComponent(encryptedUserId);
  }
  if (encryptedCaseId.includes('%')) {
    encryptedCaseId = decodeURIComponent(encryptedCaseId);
  }

  // Decrypt IDs
  const userId = useMemo(() => {
    try {
      return encryptedUserId ? decodeAndDecryptId(encryptedUserId) : '';
    } catch {
      return '';
    }
  }, [encryptedUserId]);

  const caseId = useMemo(() => {
    try {
      return encryptedCaseId ? decodeAndDecryptId(encryptedCaseId) : '';
    } catch {
      return '';
    }
  }, [encryptedCaseId]);

  if (!encryptedUserId || !encryptedCaseId) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h2>Invalid Case Access</h2>
        <p>The case details URL is invalid or corrupted.</p>
      </div>
    );
  }

  // Get password from session
  const session = getPasswordSession(slug || '');
  const requiredPassword = session?.password || '';

  if (!userId || !caseId) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h2>Invalid Case Access</h2>
        <p>The case details URL is invalid or corrupted.</p>
      </div>
    );
  }

  // Reset chat count function (no-op for now, can be enhanced to track unread messages)
  const resetChatCount = () => {
    // TODO: Implement unread message count tracking if needed
  };

  // Render the appropriate tab based on the URL
  const renderTabContent = () => {
    switch (tab) {
      case 'report-setting':
        return <CompanyReportSettingTab caseId={caseId} userId={userId} companySlug={slug || ''} />;
      case 'logs':
        return <CompanyLogsTab caseId={caseId} userId={userId} companySlug={slug || ''} />;
      case 'documents':
        return <CompanyDocumentsTab caseId={caseId} userId={userId} companySlug={slug || ''} />;
      case 'notes':
        return <CompanyNotesTab caseId={caseId} userId={userId} companySlug={slug || ''} />;
      case 'chat':
        return (
          <ChatProvider resetChatCount={resetChatCount}>
            <CompanyChatTab caseId={caseId} userId={userId} companySlug={slug || ''} />
          </ChatProvider>
        );
      default:
        return <CompanyCaseDetailsTab caseId={caseId} userId={userId} companySlug={slug || ''} />;
    }
  };

  return (
    <PasswordGuard companySlug={slug || ''} requiredPassword={requiredPassword}>
      <CompanyCaseDetailsLayout>{renderTabContent()}</CompanyCaseDetailsLayout>
    </PasswordGuard>
  );
}

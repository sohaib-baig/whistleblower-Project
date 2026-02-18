import { useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { useTranslate } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import LogsTab from 'src/sections/case-details/tabs/logs-tab';
import ChatTab from 'src/sections/case-details/tabs/chat-tab';
import NotesTab from 'src/sections/case-details/tabs/notes-tab';
import DocumentsTab from 'src/sections/case-details/tabs/documents-tab';
// Tab Components
import CaseDetailsTab from 'src/sections/case-details/tabs/case-details-tab';
import LegalSupportTab from 'src/sections/case-details/tabs/legal-support-tab';
import ReportSettingTab from 'src/sections/case-details/tabs/report-setting-tab';

// ----------------------------------------------------------------------

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`case-details-tabpanel-${index}`}
      aria-labelledby={`case-details-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `case-details-tab-${index}`,
    'aria-controls': `case-details-tabpanel-${index}`,
  };
}

export default function CaseDetailsPage() {
  const { t } = useTranslate('navbar');
  const params = useParams();
  const { id } = params;
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.case.caseDetails')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: t('dashboard.case.heading'), href: paths.dashboard.case.root },
          { name: t('dashboard.case.caseDetails') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="case details tabs">
            <Tab label={t('dashboard.case.detailsTabs.caseDetails')} {...a11yProps(0)} />
            <Tab label={t('dashboard.case.detailsTabs.reportSetting')} {...a11yProps(1)} />
            <Tab label={t('dashboard.case.detailsTabs.logs')} {...a11yProps(2)} />
            <Tab label={t('dashboard.case.detailsTabs.documents')} {...a11yProps(3)} />
            <Tab label={t('dashboard.case.detailsTabs.notes')} {...a11yProps(4)} />
            <Tab label={t('dashboard.case.detailsTabs.chat')} {...a11yProps(5)} />
            <Tab label={t('dashboard.case.detailsTabs.legalSupport')} {...a11yProps(6)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CaseDetailsTab caseId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ReportSettingTab caseId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <LogsTab caseId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <DocumentsTab caseId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <NotesTab caseId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <ChatTab caseId={id || ''} />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <LegalSupportTab caseId={id || ''} />
        </TabPanel>
      </Card>
    </DashboardContent>
  );
}

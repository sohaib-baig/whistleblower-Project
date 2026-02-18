import type { IRoleItem } from 'src/types/role';

import { useState, useCallback } from 'react';
import { useTabs } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { ROLE_DETAILS_TABS, ROLE_PUBLISH_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';

import { RoleDetailsToolbar } from '../role-details-toolbar';
import { RoleDetailsContent } from '../role-details-content';
import { RoleDetailsCandidates } from '../role-details-candidates';

// ----------------------------------------------------------------------

type Props = {
  role?: IRoleItem;
};

export function RoleDetailsView({ role }: Props) {
  const tabs = useTabs('content');

  const [publish, setPublish] = useState(role?.publish);

  const handleChangePublish = useCallback((newValue: string) => {
    setPublish(newValue);
  }, []);

  const renderToolbar = () => (
    <RoleDetailsToolbar
      backHref={paths.dashboard.role.root}
      editHref={paths.dashboard.role.edit(`${role?.id}`)}
      liveHref="#"
      publish={publish || ''}
      onChangePublish={handleChangePublish}
      publishOptions={ROLE_PUBLISH_OPTIONS}
    />
  );

  const renderTabs = () => (
    <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
      {ROLE_DETAILS_TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            tab.value === 'candidates' ? (
              <Label variant="filled">{role?.candidates.length}</Label>
            ) : (
              ''
            )
          }
        />
      ))}
    </Tabs>
  );

  return (
    <DashboardContent>
      {renderToolbar()}

      {renderTabs()}
      {tabs.value === 'content' && <RoleDetailsContent roleItem={role} />}
      {tabs.value === 'candidates' && <RoleDetailsCandidates candidates={role?.candidates ?? []} />}
    </DashboardContent>
  );
}

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useGetCompany } from 'src/actions/company';
import { useTranslate } from 'src/locales/use-locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CompanyCreateEditForm } from '../company-create-edit-form';

// ----------------------------------------------------------------------

type Props = {
  companyId: string;
};

export function CompanyEditView({ companyId }: Props) {
  const { t } = useTranslate('navbar');
  const { company, loading, error } = useGetCompany(companyId);

  if (loading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.company.editCompany')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.company.heading'), href: paths.dashboard.company.root },
            { name: t('dashboard.company.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}
        >
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (error || !company) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('dashboard.company.editCompany')}
          links={[
            { name: 'Dashboard', href: paths.dashboard.overview.analytics },
            { name: t('dashboard.company.heading'), href: paths.dashboard.company.root },
            { name: t('dashboard.company.edit') },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Box sx={{ typography: 'h6', mb: 1 }}>{t('dashboard.company.companyNotFound')}</Box>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            {error || t('dashboard.company.companyNotFoundMessage')}
          </Box>
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('dashboard.company.editCompany')}
        links={[
          { name: 'Dashboard', href: paths.dashboard.overview.analytics },
          { name: t('dashboard.company.heading'), href: paths.dashboard.company.root },
          { name: company.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CompanyCreateEditForm currentCompany={company} />
    </DashboardContent>
  );
}

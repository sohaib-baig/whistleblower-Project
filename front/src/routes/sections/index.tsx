import type { RouteObject } from 'react-router';

import { lazy } from 'react';
import { Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { SimpleLayout } from 'src/layouts/simple';
import { LanguagePopover } from 'src/layouts/components/language-popover';

import { authRoutes } from './auth';
import { publicRoutes } from './public';
import { companyRoutes } from './company';
import { authDemoRoutes } from './auth-demo';
import { dashboardRoutes } from './dashboard';

// ----------------------------------------------------------------------

const Page403 = lazy(() => import('src/pages/error/403'));
const Page404 = lazy(() => import('src/pages/error/404'));
const Page500 = lazy(() => import('src/pages/error/500'));
const MaintenancePage = lazy(() => import('src/pages/maintenance'));
const SignUpPage = lazy(() => import('src/pages/auth/sign-up'));
const SignupSuccessPage = lazy(() => import('src/pages/auth/signup-success'));

export const routesSection: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to={CONFIG.auth.redirectPath} replace />,
  },

  // Error
  { path: 'error/403', element: <Page403 /> },
  { path: 'error/500', element: <Page500 /> },

  // Public pages
  {
    path: 'maintenance',
    element: (
      <SimpleLayout slotProps={{ content: { compact: true } }}>
        <MaintenancePage />
      </SimpleLayout>
    ),
  },
  {
    path: 'sign-up',
    element: (
      <SimpleLayout
        slotProps={{
          header: {
            // Show only the language bar in the top-right
            slots: {
              rightArea: (
                <LanguagePopover
                  data={[
                    { value: 'sv', label: 'Swedish', countryCode: 'SE' },
                    { value: 'en', label: 'English', countryCode: 'GB' },
                    { value: 'no', label: 'Norwegian', countryCode: 'NO' },
                    { value: 'da', label: 'Danish', countryCode: 'DK' },
                    { value: 'fi', label: 'Finnish', countryCode: 'FI' },
                    { value: 'de', label: 'German', countryCode: 'DE' },
                    { value: 'fr', label: 'French', countryCode: 'FR' },
                  ]}
                />
              ),
            },
          },
        }}
      >
        <SignUpPage />
      </SimpleLayout>
    ),
  },
  {
    path: 'signup-success',
    element: (
      <SimpleLayout
        slotProps={{
          header: {
            // Remove help and settings from success page
            slots: { rightArea: null },
          },
        }}
      >
        <SignupSuccessPage />
      </SimpleLayout>
    ),
  },

  // Auth
  ...authRoutes,

  // Auth demo
  ...authDemoRoutes,

  // Dashboard
  ...dashboardRoutes,

  // Company Landing Pages
  ...companyRoutes,

  // Public Reporting Pages
  ...publicRoutes,

  // No match
  { path: '*', element: <Page404 /> },
];

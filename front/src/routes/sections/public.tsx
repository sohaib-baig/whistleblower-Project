import { lazy } from 'react';

// ----------------------------------------------------------------------

const PrivacyPolicyPage = lazy(() => import('src/pages/public/privacy-policy'));
const TermsOfServicePage = lazy(() => import('src/pages/public/terms-of-service'));
const SupportPage = lazy(() => import('src/pages/public/support'));
const PublicReportingPage = lazy(() => import('src/pages/public/reporting-page'));
const PublicAboutUsPage = lazy(() => import('src/pages/public/about-us-page'));

// ----------------------------------------------------------------------

export const publicRoutes = [
  {
    path: 'company/:companySlug/',
    element: <PublicReportingPage />,
  },
  {
    path: 'terms-conditions',
    element: <TermsOfServicePage />,
  },
  {
    path: 'company/:companySlug/create-case',
    element: <PublicReportingPage />,
  },
  {
    path: 'company/:companySlug/about-us',
    element: <PublicAboutUsPage />,
  },
  {
    path: 'privacy-policy',
    element: <PrivacyPolicyPage />,
  },
  {
    path: 'terms-of-service',
    element: <TermsOfServicePage />,
  },
  {
    path: 'support',
    element: <SupportPage />,
  },
];

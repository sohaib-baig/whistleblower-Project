import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';

import { LoadingScreen } from 'src/components/loading-screen';

import { CompanyLayout } from 'src/sections/company/company-layout';

// ----------------------------------------------------------------------

// Company Landing Pages
const CompanyAboutUsPage = lazy(() => import('src/pages/company/[slug]/about-us'));
const CompanyPrivacyPolicyPage = lazy(() => import('src/pages/company/[slug]/privacy-policy'));
const CompanyTermsAndConditionPage = lazy(
  () => import('src/pages/company/[slug]/terms-and-condition')
);
const CompanySupportPage = lazy(() => import('src/pages/company/[slug]/support'));
const CompanyLoginPage = lazy(() => import('src/pages/company/[slug]/login'));
const CompanyCreateCasePage = lazy(() => import('src/pages/company/[slug]/create-case'));
const CompanyThankYouPage = lazy(() => import('src/pages/company/[slug]/thank-you'));
const CompanyPageBySlugPage = lazy(() => import('src/pages/company/[slug]/[pageSlug]'));

// Company Case Details Pages
const CompanyCaseDetailsPageNew = lazy(
  () => import('src/pages/company/[slug]/case-details/[caseId]')
);
const CompanyCaseDetailsPageOld = lazy(
  () => import('src/pages/company/[slug]/case-details/[encryptedUserId]/[encryptedCaseId]')
);

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CompanyLayout />
    </Suspense>
  );
}

export const companyRoutes: RouteObject[] = [
  {
    path: 'company/:slug',
    element: <SuspenseOutlet />,
    children: [
      { index: true, element: <CompanyAboutUsPage /> },
      { path: 'about-us', element: <CompanyAboutUsPage /> },
      { path: 'privacy-policy', element: <CompanyPrivacyPolicyPage /> },
      { path: 'terms-and-condition', element: <CompanyTermsAndConditionPage /> },
      { path: 'support', element: <CompanySupportPage /> },
      { path: 'login', element: <CompanyLoginPage /> },
      { path: 'create-case', element: <CompanyCreateCasePage /> },
      { path: 'thank-you', element: <CompanyThankYouPage /> },
      // Case Details Routes - Simple case ID route (for password-based login)
      {
        path: 'case-details/:caseId',
        element: <CompanyCaseDetailsPageNew />,
      },
      // Legacy Case Details Routes - Use wildcard to handle both encoded and unencoded URLs
      {
        path: 'case-details/*',
        element: <CompanyCaseDetailsPageOld />,
      },
      // Dynamic page by slug route (must be last to catch remaining routes)
      { path: ':pageSlug', element: <CompanyPageBySlugPage /> },
    ],
  },
];

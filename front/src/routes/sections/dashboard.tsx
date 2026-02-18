import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AccountLayout } from 'src/sections/account/account-layout';
import { CaseDetailsLayout } from 'src/sections/case-details/case-details-layout';

import { useAuthContext } from 'src/auth/hooks';
import { AuthGuard, RoleGuard, InvoicePaymentGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

// Component to redirect case creation to public create-case page with company slug
function CaseCreateRedirect() {
  const { user } = useAuthContext();

  // Try to get company slug from user object (could be companySlug, slug, or company_id)
  const companySlug = user?.companySlug || user?.slug || user?.company_id || '';

  if (companySlug) {
    return <Navigate to={`/company/${companySlug}/create-case`} replace />;
  }

  // If no slug available, redirect to dashboard case list with error message
  // TODO: Show a toast/alert to user that they need to provide company information
  return <Navigate to="/dashboard/case" replace />;
}

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/one'));
const AnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const BlankPage = lazy(() => import('src/pages/dashboard/blank'));
const ParamsPage = lazy(() => import('src/pages/dashboard/params'));
const SubpathsPage = lazy(() => import('src/pages/dashboard/subpaths'));
const PermissionPage = lazy(() => import('src/pages/dashboard/permission'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserNewPage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const JobListPage = lazy(() => import('src/pages/dashboard/job/list'));
const JobCreatePage = lazy(() => import('src/pages/dashboard/job/new'));
const JobEditPage = lazy(() => import('src/pages/dashboard/job/edit'));
const JobDetailsPage = lazy(() => import('src/pages/dashboard/job/details'));
const RoleListPage = lazy(() => import('src/pages/dashboard/role/list'));
const RoleCreatePage = lazy(() => import('src/pages/dashboard/role/new'));
const RoleEditPage = lazy(() => import('src/pages/dashboard/role/edit'));
const RoleDetailsPage = lazy(() => import('src/pages/dashboard/role/details'));
const IntegrationListPage = lazy(() => import('src/pages/dashboard/integration/list'));
const IntegrationCreatePage = lazy(() => import('src/pages/dashboard/integration/new'));
const IntegrationEditPage = lazy(() => import('src/pages/dashboard/integration/edit'));
const IntegrationDetailsPage = lazy(() => import('src/pages/dashboard/integration/details'));
const CompanyListPage = lazy(() => import('src/pages/dashboard/company/company-list'));
const CompanyCreatePage = lazy(() => import('src/pages/dashboard/company/company-create'));
const CompanyEditPage = lazy(() => import('src/pages/dashboard/company/company-edit'));
const CategoryListPage = lazy(() => import('src/pages/dashboard/category/category-list'));
const CategoryCreatePage = lazy(() => import('src/pages/dashboard/category/category-create'));
const CategoryEditPage = lazy(() => import('src/pages/dashboard/category/category-edit'));
const DepartmentListPage = lazy(() => import('src/pages/dashboard/department/department-list'));
const DepartmentCreatePage = lazy(() => import('src/pages/dashboard/department/department-create'));
const DepartmentEditPage = lazy(() => import('src/pages/dashboard/department/department-edit'));
const ReportingLinkListPage = lazy(
  () => import('src/pages/dashboard/reporting-link/reporting-link-list')
);
// Invoice
const InvoiceListPage = lazy(() => import('src/pages/dashboard/invoice/list'));
const InvoiceDetailsPage = lazy(() => import('src/pages/dashboard/invoice/details'));
const InvoiceCreatePage = lazy(() => import('src/pages/dashboard/invoice/new'));
const InvoiceEditPage = lazy(() => import('src/pages/dashboard/invoice/edit'));
// Case
const CaseListPage = lazy(() => import('src/pages/dashboard/case/case-list'));
const CaseDetailsPage = lazy(() => import('src/pages/dashboard/case/case-details'));
// Case Details Tabs
const CaseDetailsTabPage = lazy(() => import('src/pages/dashboard/case/details/case-details'));
const CaseReportSettingPage = lazy(() => import('src/pages/dashboard/case/details/report-setting'));
const CaseLogsPage = lazy(() => import('src/pages/dashboard/case/details/logs'));
const CaseDocumentsPage = lazy(() => import('src/pages/dashboard/case/details/documents'));
const CaseLegalSupportPage = lazy(() => import('src/pages/dashboard/case/details/legal-support'));
const CaseNotesPage = lazy(() => import('src/pages/dashboard/case/details/notes'));
const CaseChatPage = lazy(() => import('src/pages/dashboard/case/details/chat'));
// Case Manager
const CaseManagerListPage = lazy(
  () => import('src/pages/dashboard/case-manager/case-manager-list')
);
const CaseManagerCreatePage = lazy(
  () => import('src/pages/dashboard/case-manager/case-manager-create')
);
const CaseManagerEditPage = lazy(
  () => import('src/pages/dashboard/case-manager/case-manager-edit')
);
// Support Ticket
const SupportTicketListPage = lazy(() => import('src/pages/dashboard/support-ticket-list'));
const SupportTicketCreatePage = lazy(() => import('src/pages/dashboard/support-ticket-create'));
const SupportTicketDetailsPage = lazy(() => import('src/pages/dashboard/support-ticket-details'));
// Question
const QuestionListPage = lazy(() => import('src/pages/dashboard/question/question-list-view'));
// News
const NewsListPage = lazy(() => import('src/pages/dashboard/news/list'));
const NewsCreatePage = lazy(() => import('src/pages/dashboard/news/new'));
const NewsDetailsPage = lazy(() => import('src/pages/dashboard/news/details'));
const NewsEditPage = lazy(() => import('src/pages/dashboard/news/edit'));
// Privacy Policy
const PrivacyPolicyListPage = lazy(() => import('src/pages/dashboard/privacy-policy/list'));
const PrivacyPolicyEditPage = lazy(() => import('src/pages/dashboard/privacy-policy/edit'));
// About Us
const AboutUsListPage = lazy(() => import('src/pages/dashboard/about-us/list'));
const AboutUsEditPage = lazy(() => import('src/pages/dashboard/about-us/edit'));
// Login Page
const LoginPageListPage = lazy(() => import('src/pages/dashboard/login-page/list'));
const LoginPageEditPage = lazy(() => import('src/pages/dashboard/login-page/edit'));
// Payment Page
const PaymentPageListPage = lazy(() => import('src/pages/dashboard/payment-page/list'));
const PaymentPageEditPage = lazy(() => import('src/pages/dashboard/payment-page/edit'));
// Policy Page
const PolicyPageListPage = lazy(() => import('src/pages/dashboard/policy-page/policy-page-list'));
const PolicyPageEditPage = lazy(() => import('src/pages/dashboard/policy-page/policy-page-edit'));
// Terms & Conditions
const TermsConditionsListPage = lazy(() => import('src/pages/dashboard/terms-conditions/list'));
const TermsConditionsEditPage = lazy(() => import('src/pages/dashboard/terms-conditions/edit'));
// Support
const SupportListPage = lazy(() => import('src/pages/dashboard/support/list'));
const SupportEditPage = lazy(() => import('src/pages/dashboard/support/edit'));
// Email Template
const EmailTemplateListPage = lazy(() => import('src/pages/dashboard/email-template/index'));
const EmailTemplateCreatePage = lazy(() => import('src/pages/dashboard/email-template/create'));
const EmailTemplateEditPage = lazy(() => import('src/pages/dashboard/email-template/edit/[id]'));

// Theme Configuration
const ThemeConfigurationPage = lazy(() => import('src/pages/dashboard/theme-configuration/index'));

// Stripe Configuration
const StripeConfigurationPage = lazy(
  () => import('src/pages/dashboard/stripe-configuration/index')
);

// Bank Details
const BankDetailsPage = lazy(() => import('src/pages/dashboard/bank-details/index'));

// Basic Configuration
const BasicConfigurationPage = lazy(() => import('src/pages/dashboard/basic-configuration/index'));

// State
const StateListPage = lazy(() => import('src/pages/dashboard/state/state-list'));
const StateCreatePage = lazy(() => import('src/pages/dashboard/state/state-create'));
const StateEditPage = lazy(() => import('src/pages/dashboard/state/state-edit'));

// Severity
const SeverityListPage = lazy(() => import('src/pages/dashboard/severity/severity-list'));
const SeverityCreatePage = lazy(() => import('src/pages/dashboard/severity/severity-create'));
const SeverityEditPage = lazy(() => import('src/pages/dashboard/severity/severity-edit'));
const AccountGeneralPage = lazy(() => import('src/pages/dashboard/user/account/general'));
const AccountChangePasswordPage = lazy(
  () => import('src/pages/dashboard/user/account/change-password')
);
const AccountInvoicePage = lazy(() => import('src/pages/dashboard/user/account/invoice'));
const AccountTwoFactorPage = lazy(() => import('src/pages/dashboard/user/account/two-factor'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? (
      <InvoicePaymentGuard>{dashboardLayout()}</InvoicePaymentGuard>
    ) : (
      <AuthGuard>
        <InvoicePaymentGuard>{dashboardLayout()}</InvoicePaymentGuard>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'blank', element: <BlankPage /> },
      { path: 'params/:id', element: <ParamsPage /> },
      { path: 'subpaths/a/b/c', element: <SubpathsPage /> },
      { path: 'permission', element: <PermissionPage /> },
      {
        path: 'user',
        children: [
          { index: true, element: <UserListPage /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserNewPage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: 'cards', element: <UserCardsPage /> },
          {
            path: 'account',
            element: (
              <AccountLayout>
                <Outlet />
              </AccountLayout>
            ),
            children: [
              { index: true, element: <AccountGeneralPage /> },
              { path: 'general', element: <AccountGeneralPage /> },
              { path: 'change-password', element: <AccountChangePasswordPage /> },
              { path: 'two-factor', element: <AccountTwoFactorPage /> },
              { path: 'invoice', element: <AccountInvoicePage /> },
            ],
          },
        ],
      },
      {
        path: 'job',
        children: [
          { index: true, element: <JobListPage /> },
          { path: 'list', element: <JobListPage /> },
          { path: 'new', element: <JobCreatePage /> },
          { path: ':id/edit', element: <JobEditPage /> },
          { path: ':id', element: <JobDetailsPage /> },
        ],
      },
      {
        path: 'role',
        children: [
          { index: true, element: <RoleListPage /> },
          { path: 'list', element: <RoleListPage /> },
          { path: 'new', element: <RoleCreatePage /> },
          { path: ':id/edit', element: <RoleEditPage /> },
          { path: ':id', element: <RoleDetailsPage /> },
        ],
      },
      {
        path: 'integration',
        children: [
          { index: true, element: <IntegrationListPage /> },
          { path: 'list', element: <IntegrationListPage /> },
          { path: 'new', element: <IntegrationCreatePage /> },
          { path: ':id/edit', element: <IntegrationEditPage /> },
          { path: ':id', element: <IntegrationDetailsPage /> },
        ],
      },
      {
        path: 'company',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <CompanyListPage /> },
          { path: 'list', element: <CompanyListPage /> },
          { path: 'new', element: <CompanyCreatePage /> },
          { path: ':id/edit', element: <CompanyEditPage /> },
        ],
      },
      {
        path: 'category',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <CategoryListPage /> },
          { path: 'list', element: <CategoryListPage /> },
          { path: 'new', element: <CategoryCreatePage /> },
          { path: ':id/edit', element: <CategoryEditPage /> },
        ],
      },
      {
        path: 'reporting-link',
        element: (
          <RoleGuard requiredRoles={['admin', 'company', 'case_manager']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <ReportingLinkListPage /> },
          { path: 'list', element: <ReportingLinkListPage /> },
        ],
      },
      {
        path: 'invoice',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <InvoiceListPage /> },
          { path: 'list', element: <InvoiceListPage /> },
          { path: ':id', element: <InvoiceDetailsPage /> },
          { path: ':id/edit', element: <InvoiceEditPage /> },
          // Only admin can create invoices
          {
            path: 'new',
            element: (
              <RoleGuard requiredRoles={['admin']}>
                <InvoiceCreatePage />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'case',
        element: (
          <RoleGuard requiredRoles={['admin', 'company', 'case_manager']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <CaseListPage /> },
          { path: 'list', element: <CaseListPage /> },
          // Only admin can create cases from dashboard
          // Case creation redirects to public create-case page
          // Note: This requires company slug, which should be available in user.companySlug or user.company_id
          {
            path: 'new',
            element: (
              <RoleGuard requiredRoles={['admin']}>
                <CaseCreateRedirect />
              </RoleGuard>
            ),
          },
          { path: ':id/details', element: <CaseDetailsPage /> },
          {
            path: ':id/details-tabs',
            element: (
              <CaseDetailsLayout>
                <Outlet />
              </CaseDetailsLayout>
            ),
            children: [
              { index: true, element: <CaseDetailsTabPage /> },
              { path: 'case-details', element: <CaseDetailsTabPage /> },
              { path: 'report-setting', element: <CaseReportSettingPage /> },
              { path: 'logs', element: <CaseLogsPage /> },
              { path: 'documents', element: <CaseDocumentsPage /> },
              { path: 'notes', element: <CaseNotesPage /> },
              { path: 'chat', element: <CaseChatPage /> },
              { path: 'legal-support', element: <CaseLegalSupportPage /> },
            ],
          },
        ],
      },
      {
        path: 'case-manager',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <CaseManagerListPage /> },
          { path: 'list', element: <CaseManagerListPage /> },
          { path: 'new', element: <CaseManagerCreatePage /> },
          { path: ':id/edit', element: <CaseManagerEditPage /> },
        ],
      },
      {
        path: 'support-tickets',
        element: (
          <RoleGuard requiredRoles={['admin', 'company', 'case_manager']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <SupportTicketListPage /> },
          { path: 'list', element: <SupportTicketListPage /> },
          { path: 'new', element: <SupportTicketCreatePage /> },
          { path: ':id', element: <SupportTicketDetailsPage /> },
        ],
      },
      {
        path: 'question',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <QuestionListPage /> },
          { path: 'list', element: <QuestionListPage /> },
        ],
      },
      {
        path: 'news',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <NewsListPage /> },
          { path: 'list', element: <NewsListPage /> },
          {
            path: 'new',
            element: (
              <RoleGuard requiredRoles={['admin']}>
                <NewsCreatePage />
              </RoleGuard>
            ),
          },
          { path: ':id', element: <NewsDetailsPage /> },
          {
            path: ':id/edit',
            element: (
              <RoleGuard requiredRoles={['admin']}>
                <NewsEditPage />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'privacy-policy',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <PrivacyPolicyListPage /> },
          { path: 'list', element: <PrivacyPolicyListPage /> },
          { path: 'edit', element: <PrivacyPolicyEditPage /> },
        ],
      },
      {
        path: 'about-us',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <AboutUsListPage /> },
          { path: 'list', element: <AboutUsListPage /> },
          { path: 'edit', element: <AboutUsEditPage /> },
        ],
      },
      {
        path: 'login-page',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <LoginPageListPage /> },
          { path: 'list', element: <LoginPageListPage /> },
          { path: 'edit', element: <LoginPageEditPage /> },
        ],
      },
      {
        path: 'policy-page',
        element: (
          <RoleGuard requiredRoles={['company', 'case_manager']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <PolicyPageListPage /> },
          { path: 'list', element: <PolicyPageListPage /> },
          {
            path: 'edit',
            element: (
              <RoleGuard requiredRoles={['company']}>
                <PolicyPageEditPage />
              </RoleGuard>
            ),
          },
        ],
      },
      {
        path: 'payment-page',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <PaymentPageListPage /> },
          { path: 'list', element: <PaymentPageListPage /> },
          { path: 'edit', element: <PaymentPageEditPage /> },
        ],
      },
      {
        path: 'terms-conditions',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <TermsConditionsListPage /> },
          { path: 'list', element: <TermsConditionsListPage /> },
          { path: 'edit', element: <TermsConditionsEditPage /> },
        ],
      },
      {
        path: 'support',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <SupportListPage /> },
          { path: 'list', element: <SupportListPage /> },
          { path: 'edit', element: <SupportEditPage /> },
        ],
      },
      {
        path: 'email-template',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <EmailTemplateListPage /> },
          { path: 'create', element: <EmailTemplateCreatePage /> },
          { path: 'edit/:id', element: <EmailTemplateEditPage /> },
        ],
      },
      {
        path: 'theme-configuration',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <ThemeConfigurationPage />
          </RoleGuard>
        ),
      },
      {
        path: 'stripe-configuration',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <StripeConfigurationPage />
          </RoleGuard>
        ),
      },
      {
        path: 'bank-details',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <BankDetailsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'basic-configuration',
        element: (
          <RoleGuard requiredRoles={['admin']}>
            <BasicConfigurationPage />
          </RoleGuard>
        ),
      },
      {
        path: 'department',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <DepartmentListPage /> },
          { path: 'list', element: <DepartmentListPage /> },
          { path: 'new', element: <DepartmentCreatePage /> },
          { path: 'create', element: <DepartmentCreatePage /> },
          { path: ':id/edit', element: <DepartmentEditPage /> },
        ],
      },
      {
        path: 'state',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <StateListPage /> },
          { path: 'list', element: <StateListPage /> },
          { path: 'new', element: <StateCreatePage /> },
          { path: 'create', element: <StateCreatePage /> },
          { path: ':id/edit', element: <StateEditPage /> },
        ],
      },
      {
        path: 'severity',
        element: (
          <RoleGuard requiredRoles={['admin', 'company']}>
            <Outlet />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <SeverityListPage /> },
          { path: 'list', element: <SeverityListPage /> },
          { path: 'new', element: <SeverityCreatePage /> },
          { path: 'create', element: <SeverityCreatePage /> },
          { path: ':id/edit', element: <SeverityEditPage /> },
        ],
      },
    ],
  },
];

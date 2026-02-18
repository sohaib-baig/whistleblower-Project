import type { TFunction } from 'i18next';
import type { UserRole } from 'src/auth/roles';
import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  home: icon('ic-home'),
  job: icon('ic-job'),
  role: icon('ic-user'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  integration: icon('ic-external'),
  payment: icon('ic-invoice'),
  company: icon('ic-banking'),
  gear: icon('ic-settings'),
};

// ----------------------------------------------------------------------

/**
 * Returns navigation data filtered by user role
 */
export function getNavDataForRole(
  role: UserRole | undefined,
  t?: TFunction
): NavSectionProps['data'] {
  // If no role, return empty array
  if (!role) {
    return [];
  }

  // Normalize role to lowercase and validate it matches UserRole type
  const roleLower = role.toLowerCase();
  let normalizedRole: UserRole;

  // Map role values to ensure they match UserRole type exactly
  if (roleLower === 'company' || roleLower === 'admin' || roleLower === 'case_manager') {
    normalizedRole = roleLower as UserRole;
  } else {
    // If role doesn't match, default to most restrictive (case_manager)
    normalizedRole = 'case_manager';
  }

  const translate = (key: string, defaultLabel: string) =>
    t ? t(`navbar:sidebar.${key}`, { defaultValue: defaultLabel }) : defaultLabel;

  const filterItemsByRole = <T extends { allowedRoles?: UserRole[]; children?: T[] }>(
    items: T[]
  ): T[] =>
    items
      .filter((item) => !item.allowedRoles || item.allowedRoles.includes(normalizedRole))
      .map((item) =>
        item.children && item.children.length > 0
          ? { ...item, children: filterItemsByRole(item.children) }
          : item
      );

  const allNavData: NavSectionProps['data'] = [
    {
      key: 'overview',
      subheader: translate('overview', 'Overview'),
      items: filterItemsByRole([
        {
          title: translate('dashboard', 'Dashboard'),
          path: paths.dashboard.overview.analytics,
          icon: ICONS.dashboard,
          allowedRoles: ['admin', 'company', 'case_manager'],
        },
      ]),
    },
    {
      key: 'management',
      subheader: translate('management', 'Management'),
      items: filterItemsByRole([
        {
          title: translate('cases', 'Cases'),
          path: paths.dashboard.case.root,
          icon: ICONS.file,
          allowedRoles: ['admin', 'company', 'case_manager'],
        },
        {
          title: translate('caseManagers', 'Case Manager'),
          path: paths.dashboard.caseManager.root,
          icon: ICONS.user,
          allowedRoles: ['admin', 'company'],
        },
        {
          title: translate('companies', 'Company'),
          path: paths.dashboard.company.root,
          icon: ICONS.company,
          allowedRoles: ['admin'],
        },
        {
          title: translate('categories', 'Category'),
          path: paths.dashboard.category.root,
          icon: ICONS.label,
          allowedRoles: ['admin'],
        },
      ]),
    },
    {
      key: 'settings',
      subheader: translate('settings', 'Settings'),
      items: filterItemsByRole([
        {
          title: translate('reportingLinks', 'Reporting Link'),
          path: paths.dashboard.reportingLink.root,
          icon: ICONS.external,
          allowedRoles: ['admin', 'company', 'case_manager'],
        },
        {
          title: translate('themeConfiguration', 'Theme Configuration'),
          path: paths.dashboard.themeConfiguration.root,
          icon: ICONS.gear,
          allowedRoles: ['admin', 'company'],
        },
        {
          title: translate('loginPage', 'Login Page'),
          path: paths.dashboard.loginPage.root,
          icon: ICONS.lock,
          allowedRoles: ['admin'],
        },
        {
          title: translate('paymentPage', 'Payment Page'),
          path: paths.dashboard.paymentPage.root,
          icon: ICONS.payment,
          allowedRoles: ['admin'],
        },
        {
          title: translate('policyPage', 'Policy Page'),
          path: paths.dashboard.policyPage.root,
          icon: ICONS.file,
          allowedRoles: ['company', 'case_manager'],
        },
        {
          title: translate('emailTemplates', 'Email Templates'),
          path: paths.dashboard.emailTemplate.root,
          icon: ICONS.mail,
          allowedRoles: ['admin'],
        },
        {
          title: translate('news', 'News'),
          path: paths.dashboard.news.root,
          icon: ICONS.blog,
          allowedRoles: ['admin', 'company'],
        },
        {
          title: translate('account', 'Account settings'),
          path: paths.dashboard.user.profile,
          icon: ICONS.user,
          allowedRoles: ['admin', 'company', 'case_manager'],
        },
        {
          title: translate('support', 'Support'),
          path: paths.dashboard.supportTicket.root,
          icon: ICONS.chat,
          allowedRoles: ['admin', 'company', 'case_manager'],
        },
      ]),
    },
    {
      key: 'configuration',
      subheader: translate('configuration', 'Configuration'),
      items: filterItemsByRole([
        {
          title: translate('stripeConfiguration', 'Stripe Configuration'),
          path: paths.dashboard.stripeConfiguration.root,
          icon: ICONS.gear,
          allowedRoles: ['admin'],
        },
        {
          title: translate('bankDetails', 'Bank Details'),
          path: paths.dashboard.bankDetails.root,
          icon: ICONS.gear,
          allowedRoles: ['admin'],
        },
        {
          title: translate('basicConfiguration', 'Basic Configuration'),
          path: paths.dashboard.basicConfiguration.root,
          icon: ICONS.gear,
          allowedRoles: ['admin'],
        },
      ]),
    },
  ];

  return allNavData.filter((section) => section.items.length > 0);
}

// Default export for backwards compatibility - this will show English translations
// In actual usage, use getNavDataForRole with translation function
export const navData: NavSectionProps['data'] = getNavDataForRole('admin');

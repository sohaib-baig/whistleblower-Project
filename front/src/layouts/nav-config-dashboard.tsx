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

export const navData: NavSectionProps['data'] = [
  /**
   * Overview
   */
  {
    subheader: 'Overview',
    items: [{ title: 'Home', path: paths.dashboard.overview.analytics, icon: ICONS.dashboard }],
  },
  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      // { title: 'Users', path: paths.dashboard.user.root, icon: ICONS.user },
      { title: 'Companies', path: paths.dashboard.company.root, icon: ICONS.company },
      // { title: 'Payments', path: paths.dashboard.user.root, icon: ICONS.payment },
      { title: 'Cases', path: paths.dashboard.case.root, icon: ICONS.file },
      { title: 'Case Managers', path: paths.dashboard.caseManager.root, icon: ICONS.user },
      { title: 'sidebar.supportTickets', path: paths.dashboard.supportTicket.root, icon: ICONS.chat },
      { title: 'News', path: paths.dashboard.news.root, icon: ICONS.blog },
      // { title: 'Users', path: paths.dashboard.user.root, icon: ICONS.user },
      // { title: 'Profile', path: paths.dashboard.user.profile, icon: ICONS.user },
      // { title: 'Jobs', path: paths.dashboard.job.root, icon: ICONS.job },
      // { title: 'Roles', path: paths.dashboard.role.root, icon: ICONS.role },
      // { title: 'Integrations', path: paths.dashboard.integration.root, icon: ICONS.integration }
    ],
  },
  /**
   * Settings
   */
  {
    subheader: 'Settings',
    items: [
      {
        title: 'Management',
        path: paths.dashboard.department.root,
        icon: ICONS.gear,
        children: [
          { title: 'Department', path: paths.dashboard.department.root },
          { title: 'State', path: paths.dashboard.state.root },
          { title: 'Severity', path: paths.dashboard.severity.root },
        ],
      },
      {
        title: 'Email Templates',
        path: paths.dashboard.emailTemplate.root,
        icon: ICONS.mail,
        allowedRoles: ['admin'],
      },
    ],
  },
  /**
   * Pages
   */
  {
    subheader: 'Pages',
    items: [
      {
        title: 'Pages',
        path: paths.dashboard.user.root,
        icon: ICONS.file,
        children: [
          { title: 'About Us', path: paths.dashboard.aboutUs.root },
          { title: 'Login Page', path: paths.dashboard.loginPage.root },
          { title: 'Payment Page', path: paths.dashboard.paymentPage.root },
        ],
      },
    ],
  },
  /**
   * User Preferences
   */
  {
    subheader: 'Preferences',
    items: [
      {
        title: 'Theme Configuration',
        path: paths.dashboard.themeConfiguration.root,
        icon: ICONS.gear,
      },
    ],
  },
  {
    subheader: 'Miscelaneous',
    items: [
      {
        title: 'Settings',
        path: paths.dashboard.user.root,
        icon: ICONS.gear,
        children: [
          { title: 'Stripe Configuration', path: paths.dashboard.stripeConfiguration.root },
          { title: 'Bank Details', path: paths.dashboard.bankDetails.root },
          { title: 'Basic configuration', path: paths.dashboard.basicConfiguration.root },
          { title: 'Language', path: paths.dashboard.support.root },
        ],
      },
    ],
  },
  {
    subheader: 'Configuration',
    items: [
      {
        title: 'Stripe Configuration',
        path: paths.dashboard.stripeConfiguration.root,
        icon: ICONS.gear,
      },
      {
        title: 'Bank Details',
        path: paths.dashboard.bankDetails.root,
        icon: ICONS.gear,
      },
      {
        title: 'Basic Configuration',
        path: paths.dashboard.basicConfiguration.root,
        icon: ICONS.gear,
      },
    ],
  },
  /**
   * General
   */
  // {
  //   subheader: 'General',
  //   items: [
  //     { title: 'Blank', path: paths.dashboard.blank, icon: ICONS.blank },
  //     { title: 'Permission', path: paths.dashboard.permission, icon: ICONS.lock },
  //   ],
  // },
];

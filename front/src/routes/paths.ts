import { encodeForUrl } from 'src/utils/encryption';

// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  AUTH_DEMO: '/auth-demo',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  maintenance: '/maintenance',
  faqs: '/faqs',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  signUp: '/sign-up',
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/sign-in`,
      signUp: `${ROOTS.AUTH}/sign-up`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
    forgotPassword: `${ROOTS.AUTH}/forgot-password`,
    resetPassword: `${ROOTS.AUTH}/reset-password`,
    setPassword: `${ROOTS.AUTH}/set-password`,
    twoFactor: `${ROOTS.AUTH}/two-factor`,
  },
  authDemo: {
    split: {
      signIn: `${ROOTS.AUTH_DEMO}/split/sign-in`,
      signUp: `${ROOTS.AUTH_DEMO}/split/sign-up`,
      resetPassword: `${ROOTS.AUTH_DEMO}/split/reset-password`,
      updatePassword: `${ROOTS.AUTH_DEMO}/split/update-password`,
      verify: `${ROOTS.AUTH_DEMO}/split/verify`,
    },
    centered: {
      signIn: `${ROOTS.AUTH_DEMO}/centered/sign-in`,
      signUp: `${ROOTS.AUTH_DEMO}/centered/sign-up`,
      resetPassword: `${ROOTS.AUTH_DEMO}/centered/reset-password`,
      updatePassword: `${ROOTS.AUTH_DEMO}/centered/update-password`,
      verify: `${ROOTS.AUTH_DEMO}/centered/verify`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: `${ROOTS.DASHBOARD}`,
    blank: `${ROOTS.DASHBOARD}/blank`,
    permission: `${ROOTS.DASHBOARD}/permission`,
    overview: {
      analytics: `${ROOTS.DASHBOARD}/analytics`,
    },
    company: {
      root: `${ROOTS.DASHBOARD}/company`,
      list: `${ROOTS.DASHBOARD}/company/list`,
      new: `${ROOTS.DASHBOARD}/company/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/company/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/company/${id}`,
    },
    category: {
      root: `${ROOTS.DASHBOARD}/category`,
      list: `${ROOTS.DASHBOARD}/category/list`,
      new: `${ROOTS.DASHBOARD}/category/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/category/${id}/edit`,
    },
    department: {
      root: `${ROOTS.DASHBOARD}/department`,
      list: `${ROOTS.DASHBOARD}/department/list`,
      new: `${ROOTS.DASHBOARD}/department/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/department/${id}/edit`,
    },
    reportingLink: {
      root: `${ROOTS.DASHBOARD}/reporting-link`,
      list: `${ROOTS.DASHBOARD}/reporting-link/list`,
    },
    invoice: {
      root: `${ROOTS.DASHBOARD}/invoice`,
      list: `${ROOTS.DASHBOARD}/invoice/list`,
      new: `${ROOTS.DASHBOARD}/invoice/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/invoice/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/invoice/${id}`,
    },
    case: {
      root: `${ROOTS.DASHBOARD}/case`,
      list: `${ROOTS.DASHBOARD}/case/list`,
      new: `${ROOTS.DASHBOARD}/case/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details`,
      detailsRoot: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details`,
      reportSetting: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details/report-setting`,
      logs: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details/logs`,
      documents: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details/documents`,
      notes: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details/notes`,
      chat: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details/chat`,
      legalSupport: (id: string) => `${ROOTS.DASHBOARD}/case/${id}/details/legal-support`,
    },
    caseManager: {
      root: `${ROOTS.DASHBOARD}/case-manager`,
      list: `${ROOTS.DASHBOARD}/case-manager/list`,
      new: `${ROOTS.DASHBOARD}/case-manager/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/case-manager/${id}/edit`,
    },
    supportTicket: {
      root: `${ROOTS.DASHBOARD}/support-tickets`,
      list: `${ROOTS.DASHBOARD}/support-tickets/list`,
      new: `${ROOTS.DASHBOARD}/support-tickets/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/support-tickets/${id}`,
    },
    question: {
      root: `${ROOTS.DASHBOARD}/question`,
      list: `${ROOTS.DASHBOARD}/question/list`,
      new: `${ROOTS.DASHBOARD}/question/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/question/${id}/edit`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      profile: `${ROOTS.DASHBOARD}/user/account`,
    },
    job: {
      root: `${ROOTS.DASHBOARD}/job`,
      list: `${ROOTS.DASHBOARD}/job/list`,
      new: `${ROOTS.DASHBOARD}/job/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/job/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/job/${id}`,
    },
    role: {
      root: `${ROOTS.DASHBOARD}/role`,
      list: `${ROOTS.DASHBOARD}/role/list`,
      new: `${ROOTS.DASHBOARD}/role/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/role/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/role/${id}`,
    },
    integration: {
      root: `${ROOTS.DASHBOARD}/integration`,
      list: `${ROOTS.DASHBOARD}/integration/list`,
      new: `${ROOTS.DASHBOARD}/integration/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/integration/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/integration/${id}`,
    },
    news: {
      root: `${ROOTS.DASHBOARD}/news`,
      list: `${ROOTS.DASHBOARD}/news/list`,
      new: `${ROOTS.DASHBOARD}/news/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/news/${id}/edit`,
      details: (id: string) => `${ROOTS.DASHBOARD}/news/${id}`,
    },
    privacyPolicy: {
      root: `${ROOTS.DASHBOARD}/privacy-policy`,
      list: `${ROOTS.DASHBOARD}/privacy-policy/list`,
      edit: `${ROOTS.DASHBOARD}/privacy-policy/edit`,
    },
    aboutUs: {
      root: `${ROOTS.DASHBOARD}/about-us`,
      list: `${ROOTS.DASHBOARD}/about-us/list`,
      edit: `${ROOTS.DASHBOARD}/about-us/edit`,
    },
    loginPage: {
      root: `${ROOTS.DASHBOARD}/login-page`,
      list: `${ROOTS.DASHBOARD}/login-page/list`,
      edit: `${ROOTS.DASHBOARD}/login-page/edit`,
    },
    policyPage: {
      root: `${ROOTS.DASHBOARD}/policy-page`,
      list: `${ROOTS.DASHBOARD}/policy-page/list`,
      edit: `${ROOTS.DASHBOARD}/policy-page/edit`,
    },
    paymentPage: {
      root: `${ROOTS.DASHBOARD}/payment-page`,
      list: `${ROOTS.DASHBOARD}/payment-page/list`,
      edit: `${ROOTS.DASHBOARD}/payment-page/edit`,
    },
    termsConditions: {
      root: `${ROOTS.DASHBOARD}/terms-conditions`,
      list: `${ROOTS.DASHBOARD}/terms-conditions/list`,
      edit: `${ROOTS.DASHBOARD}/terms-conditions/edit`,
    },
    support: {
      root: `${ROOTS.DASHBOARD}/support`,
      list: `${ROOTS.DASHBOARD}/support/list`,
      edit: `${ROOTS.DASHBOARD}/support/edit`,
    },
    emailTemplate: {
      root: `${ROOTS.DASHBOARD}/email-template`,
      create: `${ROOTS.DASHBOARD}/email-template/create`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/email-template/edit/${id}`,
    },
    themeConfiguration: {
      root: `${ROOTS.DASHBOARD}/theme-configuration`,
    },
    stripeConfiguration: {
      root: `${ROOTS.DASHBOARD}/stripe-configuration`,
    },
    bankDetails: {
      root: `${ROOTS.DASHBOARD}/bank-details`,
    },
    basicConfiguration: {
      root: `${ROOTS.DASHBOARD}/basic-configuration`,
    },
    state: {
      root: `${ROOTS.DASHBOARD}/state`,
      list: `${ROOTS.DASHBOARD}/state/list`,
      new: `${ROOTS.DASHBOARD}/state/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/state/${id}/edit`,
    },
    severity: {
      root: `${ROOTS.DASHBOARD}/severity`,
      list: `${ROOTS.DASHBOARD}/severity/list`,
      new: `${ROOTS.DASHBOARD}/severity/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/severity/${id}/edit`,
    },
  },
  // COMPANY
  company: {
    root: '/company',
    login: (slug: string) => `/company/${slug}/login`,
    createCase: (slug: string) => `/company/${slug}/create-case`,
    thankYou: (slug: string) => `/company/${slug}/thank-you`,
    caseDetails: (slug: string, encryptedUserId: string, encryptedCaseId: string) =>
      `/company/${slug}/case-details/${encodeForUrl(encryptedUserId)}/${encodeForUrl(encryptedCaseId)}`,
    caseDetailsRoot: (slug: string, encryptedUserId: string, encryptedCaseId: string) =>
      `/company/${slug}/case-details/${encodeForUrl(encryptedUserId)}/${encodeForUrl(encryptedCaseId)}`,
    caseReportSetting: (slug: string, encryptedUserId: string, encryptedCaseId: string) =>
      `/company/${slug}/case-details/${encodeForUrl(encryptedUserId)}/${encodeForUrl(encryptedCaseId)}/report-setting`,
    caseLogs: (slug: string, encryptedUserId: string, encryptedCaseId: string) =>
      `/company/${slug}/case-details/${encodeForUrl(encryptedUserId)}/${encodeForUrl(encryptedCaseId)}/logs`,
    caseDocuments: (slug: string, encryptedUserId: string, encryptedCaseId: string) =>
      `/company/${slug}/case-details/${encodeForUrl(encryptedUserId)}/${encodeForUrl(encryptedCaseId)}/documents`,
    caseNotes: (slug: string, encryptedUserId: string, encryptedCaseId: string) =>
      `/company/${slug}/case-details/${encodeForUrl(encryptedUserId)}/${encodeForUrl(encryptedCaseId)}/notes`,
    caseChat: (slug: string, encryptedUserId: string, encryptedCaseId: string) =>
      `/company/${slug}/case-details/${encodeForUrl(encryptedUserId)}/${encodeForUrl(encryptedCaseId)}/chat`,
  },
};

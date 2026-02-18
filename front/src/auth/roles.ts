// ----------------------------------------------------------------------

export type UserRole = 'admin' | 'company' | 'case_manager';

export type RolePermissions = {
  canViewAllCases: boolean;
  canViewAllInvoices: boolean;
  canManageCompanies: boolean;
  canManageCaseManagers: boolean;
  canManageQuestions: boolean;
  canManageNews: boolean;
  canManageSettings: boolean;
  canManageInvoices: boolean;
};

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewAllCases: true,
    canViewAllInvoices: true,
    canManageCompanies: true,
    canManageCaseManagers: true,
    canManageQuestions: true,
    canManageNews: true,
    canManageSettings: true,
    canManageInvoices: true,
  },
  company: {
    canViewAllCases: false,
    canViewAllInvoices: true,
    canManageCompanies: false,
    canManageCaseManagers: false,
    canManageQuestions: false,
    canManageNews: false,
    canManageSettings: false,
    canManageInvoices: true,
  },
  case_manager: {
    canViewAllCases: false,
    canViewAllInvoices: false,
    canManageCompanies: false,
    canManageCaseManagers: false,
    canManageQuestions: false,
    canManageNews: false,
    canManageSettings: false,
    canManageInvoices: false,
  },
};

// ----------------------------------------------------------------------

export function hasPermission(
  role: UserRole | undefined,
  permission: keyof RolePermissions
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role][permission];
}

import type { UserRole } from './roles';

export type UserType =
  | (Record<string, any> & {
      role?: UserRole;
      companyId?: string;
      caseManagerId?: string;
    })
  | null;

export type AuthState = {
  user: UserType;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};

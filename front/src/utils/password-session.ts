// ----------------------------------------------------------------------

const PASSWORD_STORAGE_KEY = 'company_case_password';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// ----------------------------------------------------------------------

interface PasswordSession {
  password: string;
  timestamp: number;
  companySlug: string;
  userId?: string;
  caseId?: string;
}

// ----------------------------------------------------------------------

export const validatePassword = (enteredPassword: string, storedPassword: string): boolean =>
  enteredPassword === storedPassword;

export const storePasswordSession = (
  password: string,
  companySlug: string,
  userId?: string,
  caseId?: string
): void => {
  try {
    const session: PasswordSession = {
      password,
      timestamp: Date.now(),
      companySlug,
      userId,
      caseId,
    };

    localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store password session:', error);
    throw new Error('Failed to store authentication session');
  }
};

export const getPasswordSession = (companySlug: string): PasswordSession | null => {
  try {
    const stored = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (!stored) return null;

    const session: PasswordSession = JSON.parse(stored);
    const isExpired = Date.now() - session.timestamp > SESSION_TIMEOUT;

    if (isExpired || session.companySlug !== companySlug) {
      localStorage.removeItem(PASSWORD_STORAGE_KEY);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get password session:', error);
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
    return null;
  }
};

export const clearPasswordSession = (): void => {
  try {
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear password session:', error);
  }
};

export const isPasswordSessionValid = (companySlug: string): boolean => {
  const session = getPasswordSession(companySlug);
  return session !== null;
};

export const getSessionInfo = (
  companySlug: string
): {
  isValid: boolean;
  userId?: string;
  caseId?: string;
  timeRemaining?: number;
} => {
  const session = getPasswordSession(companySlug);

  if (!session) {
    return { isValid: false };
  }

  const timeRemaining = SESSION_TIMEOUT - (Date.now() - session.timestamp);

  return {
    isValid: true,
    userId: session.userId,
    caseId: session.caseId,
    timeRemaining: Math.max(0, timeRemaining),
  };
};

// ----------------------------------------------------------------------

export const refreshPasswordSession = (companySlug: string): boolean => {
  const session = getPasswordSession(companySlug);

  if (!session) {
    return false;
  }

  // Update timestamp to extend session
  storePasswordSession(session.password, session.companySlug, session.userId, session.caseId);

  return true;
};

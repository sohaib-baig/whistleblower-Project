import type { UserRole } from './roles';

// ----------------------------------------------------------------------

// Demo user accounts for testing different roles
export const DEMO_ACCOUNTS = {
  admin: {
    email: 'admin@wisling.com',
    password: 'admin123',
    user: {
      id: 'admin-001',
      email: 'admin@wisling.com',
      displayName: 'Admin User',
      photoURL: '/assets/images/avatar/avatar-25.webp',
      phoneNumber: '+1-555-0100',
      role: 'admin' as UserRole,
      // Admin doesn't need companyId or caseManagerId
    },
  },
  company: {
    email: 'company@wisling.com',
    password: 'company123',
    user: {
      id: 'company-001',
      email: 'company@wisling.com',
      displayName: 'Company Manager',
      photoURL: '/assets/images/avatar/avatar-26.webp',
      phoneNumber: '+1-555-0101',
      role: 'company' as UserRole,
      companyId: 'e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1', // Matches mock data (index % 10, this is ID for index 1)
    },
  },
  caseManager: {
    email: 'manager@wisling.com',
    password: 'manager123',
    user: {
      id: 'case-manager-001',
      email: 'manager@wisling.com',
      displayName: 'Case Manager',
      photoURL: '/assets/images/avatar/avatar-27.webp',
      phoneNumber: '+1-555-0102',
      role: 'case_manager' as UserRole,
      caseManagerId: 'e99f09a7-dd88-49d5-b1c8-1daf80c2d7b1', // Matches mock data (index % 5, this is ID for index 1)
    },
  },
};

// Generate a simple JWT token (for demo purposes only - NOT FOR PRODUCTION)
function generateMockJWT(user: any): string {
  try {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        ...user,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3, // 3 days
        iat: Math.floor(Date.now() / 1000),
      })
    );
    const signature = btoa('mock-signature-not-for-production');

    return `${header}.${payload}.${signature}`;
  } catch (error) {
    console.error('Error generating mock JWT:', error);
    throw new Error('Failed to generate authentication token');
  }
}

// Mock authentication handler
export function mockSignIn(email: string, password: string): { accessToken: string } {
  // Find matching demo account
  const account = Object.values(DEMO_ACCOUNTS).find(
    (acc) => acc.email === email && acc.password === password
  );

  if (!account) {
    throw new Error('Invalid email or password');
  }

  const accessToken = generateMockJWT(account.user);

  return { accessToken };
}

// Simple JWT decoder for mock tokens (demo purposes only)
function decodeMockJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding mock JWT:', error);
    throw new Error('Invalid token');
  }
}

// Mock get user info
export function mockGetUserInfo(token: string): { user: any } {
  try {
    // Decode the JWT token
    const decoded = decodeMockJWT(token);

    // Remove JWT metadata (exp and iat are not needed in the user object)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { exp, iat, ...user } = decoded as any;

    return { user };
  } catch (error) {
    console.error('Error decoding mock JWT:', error);
    throw new Error('Invalid token');
  }
}

// Check if email is a demo account
export function isDemoAccount(email: string): boolean {
  return Object.values(DEMO_ACCOUNTS).some((acc) => acc.email === email);
}

// Get all demo accounts info (for displaying on login screen)
export function getDemoAccountsInfo() {
  return [
    {
      role: 'Admin',
      email: DEMO_ACCOUNTS.admin.email,
      password: DEMO_ACCOUNTS.admin.password,
      description: 'Full access to all modules',
    },
    {
      role: 'Company',
      email: DEMO_ACCOUNTS.company.email,
      password: DEMO_ACCOUNTS.company.password,
      description: 'Access to company data only',
    },
    {
      role: 'Case Manager',
      email: DEMO_ACCOUNTS.caseManager.email,
      password: DEMO_ACCOUNTS.caseManager.password,
      description: 'Access to assigned cases only',
    },
  ];
}

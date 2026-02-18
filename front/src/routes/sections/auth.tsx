import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { SplashScreen } from 'src/components/loading-screen';

import { GuestGuard } from 'src/auth/guard';
import { AuthWithContent } from 'src/auth/components/auth-with-content';
import { SignInWithContent } from 'src/auth/components/sign-in-with-content';

// ----------------------------------------------------------------------

/** **************************************
 * Jwt
 *************************************** */
const Jwt = {
  SignInPage: lazy(() => import('src/pages/auth/jwt/sign-in')),
};
const ForgotPasswordPage = lazy(() => import('src/pages/auth/forgot-password'));
const ResetPasswordPage = lazy(() => import('src/pages/auth/reset-password'));
const SetPasswordPage = lazy(() => import('src/pages/auth/set-password'));
const TwoFactorPage = lazy(() => import('src/pages/auth/two-factor'));

const authJwt = {
  path: '',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <SignInWithContent>
            <Jwt.SignInPage />
          </SignInWithContent>
        </GuestGuard>
      ),
    },
    {
      path: 'forgot-password',
      element: (
        <GuestGuard>
          <AuthWithContent>
            <ForgotPasswordPage />
          </AuthWithContent>
        </GuestGuard>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <GuestGuard>
          <AuthWithContent>
            <ResetPasswordPage />
          </AuthWithContent>
        </GuestGuard>
      ),
    },
    {
      path: 'set-password',
      element: (
        <GuestGuard>
          <AuthWithContent>
            <SetPasswordPage />
          </AuthWithContent>
        </GuestGuard>
      ),
    },
    {
      path: 'two-factor',
      element: (
        <GuestGuard>
          <AuthWithContent>
            <TwoFactorPage />
          </AuthWithContent>
        </GuestGuard>
      ),
    },
  ],
};

// ----------------------------------------------------------------------

export const authRoutes: RouteObject[] = [
  {
    path: 'auth',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authJwt],
  },
];

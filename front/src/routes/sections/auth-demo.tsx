import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

/** **************************************
 * Centered layout
 * *************************************** */
const CenteredLayout = {
  SignInPage: lazy(() => import('src/pages/auth-demo/centered/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth-demo/centered/sign-up')),
  VerifyPage: lazy(() => import('src/pages/auth-demo/centered/verify')),
  ResetPasswordPage: lazy(() => import('src/pages/auth-demo/centered/reset-password')),
  UpdatePasswordPage: lazy(() => import('src/pages/auth-demo/centered/update-password')),
};

const authCentered = {
  path: 'centered',
  element: (
    <AuthCenteredLayout>
      <Outlet />
    </AuthCenteredLayout>
  ),
  children: [
    { path: 'sign-in', element: <CenteredLayout.SignInPage /> },
    { path: 'sign-up', element: <CenteredLayout.SignUpPage /> },
    { path: 'verify', element: <CenteredLayout.VerifyPage /> },
    { path: 'reset-password', element: <CenteredLayout.ResetPasswordPage /> },
    { path: 'update-password', element: <CenteredLayout.UpdatePasswordPage /> },
  ],
};

// ----------------------------------------------------------------------

export const authDemoRoutes: RouteObject[] = [
  {
    path: 'auth-demo',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authCentered],
  },
];

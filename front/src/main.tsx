import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router';

import App from './app';
import { routesSection } from './routes/sections';
import { ErrorBoundary } from './routes/components';
import { setupMockAuthHandlers } from './lib/axios-mock-adapter';

// ----------------------------------------------------------------------
// Defensive runtime guard: avoid crashes if third-party code calls
// Object.entries on null/undefined in production bundles.
// This returns an empty array instead of throwing, so the app can still mount.
// ----------------------------------------------------------------------
const originalObjectEntries = Object.entries as unknown as (
  obj: object
) => Array<[string, unknown]>;
Object.entries = function safeObjectEntries(obj: unknown) {
  if (obj == null) return [];
  return (originalObjectEntries as unknown as typeof Object.entries).call(Object, obj as object);
};

// Setup mock authentication handlers for demo accounts
setupMockAuthHandlers();

// ----------------------------------------------------------------------

const router = createBrowserRouter([
  {
    Component: () => (
      <App>
        <Outlet />
      </App>
    ),
    errorElement: <ErrorBoundary />,
    children: routesSection,
  },
]);

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

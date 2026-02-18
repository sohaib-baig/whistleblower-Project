import type { ReactNode } from 'react';

import { AuthSplitLayout } from 'src/layouts/auth-split';
import { useGetPublicLoginPage } from 'src/actions/login-page-public';

// ----------------------------------------------------------------------

type AuthWithContentProps = {
  children: ReactNode;
};

/**
 * Wrapper component that fetches login page content and passes it to AuthSplitLayout
 * Can be used for all auth pages (sign-in, forgot-password, reset-password, etc.)
 */
export function AuthWithContent({ children }: AuthWithContentProps) {
  const { data: loginPage, isLoading } = useGetPublicLoginPage();

  // Get content from login page
  const getSectionContent = () => {
    if (isLoading || !loginPage) {
      return {
        title: 'Hi, Welcome back',
        subtitle: 'More effectively with optimized workflows.',
      };
    }


    // If page_content exists, use it as HTML content
    if (loginPage.page_content) {
      // Combine page_title and page_content for full HTML display
      // Remove the first h1/h2 if it exists in page_content to avoid duplication
      let content = loginPage.page_content;

      // If page_content doesn't start with a heading and title exists, add the page_title as h1
      if (!content.trim().match(/^<h[1-6]/i) && loginPage.page_title?.trim()) {
        content = `<h1>${loginPage.page_title.trim()}</h1>${content}`;
      }

      return { content };
    }

    // Fallback to title/subtitle if no content
    // Only show title if it exists, otherwise use default
    const title = loginPage.page_title?.trim();
    return {
      title: title || 'Hi, Welcome back',
      subtitle: 'More effectively with optimized workflows.',
    };
  };

  const sectionProps = getSectionContent();

  return (
    <AuthSplitLayout
      slotProps={{
        section: sectionProps,
      }}
    >
      {children}
    </AuthSplitLayout>
  );
}


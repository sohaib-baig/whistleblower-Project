import type { CompanyLanding } from 'src/types/company-landing';

import { useState, useEffect } from 'react';
import { Outlet, useParams } from 'react-router';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme, createTheme, ThemeProvider } from '@mui/material/styles';

import { useTranslate } from 'src/locales/use-locales';
import { _languageOptions } from 'src/_mock/_company-landing';
import { getCompanyBySlug } from 'src/actions/company-landing';

import { CompanyNavigation } from './company-navigation';

// ----------------------------------------------------------------------

export function CompanyLayout() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslate('company');
  const [company, setCompany] = useState<CompanyLanding | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Get the main theme to extend it
  const mainTheme = useTheme();

  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) return;

      try {
        // Reset state when slug changes to prevent showing stale data
        setLoading(true);
        setCompany(null); // Clear previous company data
        
        const companyData = await getCompanyBySlug(slug);
        setCompany(companyData);
      } catch (error) {
        console.error('Error fetching company:', error);
        // Explicitly set company to null on error
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [slug]);

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    // In a real application, you might want to persist this in localStorage
    localStorage.setItem('company-language', language);
  };

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('company-language');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        {t('layout.loading')}
      </Box>
    );
  }

  if (!company) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h4" gutterBottom>
          {t('layout.companyNotFound')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('layout.companyNotFoundMessage')}
        </Typography>
      </Box>
    );
  }

  // Create company-specific theme that extends the main theme
  const companyTheme = createTheme(mainTheme, {
    palette: {
      primary: {
        main: company.primaryColor,
      },
      secondary: {
        main: company.secondaryColor,
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: company.primaryColor,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={companyTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <CompanyNavigation
          company={company}
          languageOptions={_languageOptions}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

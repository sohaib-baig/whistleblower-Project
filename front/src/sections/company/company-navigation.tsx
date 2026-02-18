import type { CompanyLanding, LanguageOption } from 'src/types/company-landing';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListItemButton from '@mui/material/ListItemButton';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';
import { useTranslate } from 'src/locales/use-locales';
import { LanguagePopover } from 'src/layouts/components/language-popover';
import { getNavigationPages, type NavigationPage } from 'src/actions/company-landing';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface CompanyNavigationProps {
  company: CompanyLanding;
  languageOptions: LanguageOption[];
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function CompanyNavigation({
  company,
  languageOptions,
  currentLanguage,
  onLanguageChange,
}: CompanyNavigationProps) {
  const location = useLocation();
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslate('company');
  const router = useRouter();

  // Check if we're on a case-details page
  const isCaseDetailsPage = location.pathname.includes('/case-details/');

  // Handle logout - redirect to company page
  const handleLogout = () => {
    // Always use route slug parameter (preferred) or company.slug for URLs
    const companyIdentifier = routeSlug || company.slug || company.id;
    router.push(`/company/${companyIdentifier}/`);
  };

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [smallLogo, setSmallLogo] = useState<string | null>(null);
  const [navigationPages, setNavigationPages] = useState<NavigationPage[]>([]);
  const [reportingPageTitle, setReportingPageTitle] = useState<string | null>(null);
  const [reportingPageSlug, setReportingPageSlug] = useState<string | null>(null);

  useEffect(() => {
    const loadSiteLogo = async () => {
      try {
        const res = await axios.get(endpoints.public.siteLogo.get);
        const data: any = (res as any)?.data || {};
        const logo = data?.data?.logo ?? data?.logo;
        if (logo) {
          // Storage::url() returns relative paths like /storage/...
          // Get the base URL from axios instance (which uses CONFIG.serverUrl)
          const axiosBaseURL = axios.defaults.baseURL || CONFIG.serverUrl;
          let logoUrl = logo;
          if (logo.startsWith('/')) {
            // Prefix with the backend API server URL
            logoUrl = `${axiosBaseURL || ''}${logo}`;
          } else if (!logo.startsWith('http')) {
            // If it's not already a full URL, prefix with base URL
            logoUrl = `${axiosBaseURL || ''}/${logo}`;
          }
          setSiteLogo(logoUrl);
        }
      } catch (error) {
        console.error('Failed to load site logo:', error);
        console.error('Logo endpoint response:', error);
      }
    };
    loadSiteLogo();
  }, []);

  useEffect(() => {
    const loadSmallLogo = async () => {
      try {
        const res = await axios.get(endpoints.public.smallLogo.get);
        const data: any = (res as any)?.data || {};
        const logo = data?.data?.small_logo ?? data?.small_logo;
        if (logo) {
          // Storage::url() returns relative paths like /storage/...
          // Get the base URL from axios instance (which uses CONFIG.serverUrl)
          const axiosBaseURL = axios.defaults.baseURL || CONFIG.serverUrl;
          let logoUrl = logo;
          if (logo.startsWith('/')) {
            // Prefix with the backend API server URL
            logoUrl = `${axiosBaseURL || ''}${logo}`;
          } else if (!logo.startsWith('http')) {
            // If it's not already a full URL, prefix with base URL
            logoUrl = `${axiosBaseURL || ''}/${logo}`;
          }
          setSmallLogo(logoUrl);
        }
      } catch (error) {
        console.error('Failed to load small logo:', error);
      }
    };
    loadSmallLogo();
  }, []);

  useEffect(() => {
    const loadNavigationPages = async () => {
      try {
        const pages = await getNavigationPages(company.slug);
        setNavigationPages(pages);
      } catch (error) {
        console.error('Failed to load navigation pages:', error);
        setNavigationPages([]);
      }
    };

    loadNavigationPages();
  }, [company.slug]);

  useEffect(() => {
    const loadReportingPageTitle = async () => {
      try {
        // Always use route slug parameter (preferred) or company.slug for API calls (API supports both slug and ID)
        const companyIdentifier = routeSlug || company.slug || company.id;
        const res = await axios.get(endpoints.public.pages.reportingPage(companyIdentifier));
        const payload: any = (res as any)?.data || {};
        const page = payload?.data ?? payload;
        const title = page?.page_title || null;
        const pageSlug = page?.page_slug || null;
        setReportingPageTitle(title);
        setReportingPageSlug(pageSlug);
      } catch (error) {
        console.error('Failed to load reporting page title:', error);
        setReportingPageTitle(null);
        setReportingPageSlug(null);
      }
    };

    loadReportingPageTitle();
  }, [routeSlug, company.id, company.slug, currentLanguage]);

  // Construct company logo URL
  const companyLogoUrl = useMemo(() => {
    if (!company.logo) return null;
    const axiosBaseURL = axios.defaults.baseURL || CONFIG.serverUrl;
    let url = company.logo;
    if (company.logo.startsWith('/')) {
      url = `${axiosBaseURL || ''}${company.logo}`;
    } else if (!company.logo.startsWith('http')) {
      url = `${axiosBaseURL || ''}/${company.logo}`;
    }
    return url;
  }, [company.logo]);

  // Build navigation items dynamically from backend pages
  // Use route slug parameter instead of company.slug to ensure URLs use slug not ID
  const navigationItems = useMemo(() => {
    const companySlug = routeSlug || company.slug; // Prefer route parameter slug
    // Use page_slug if available, otherwise fallback to "about-us" for backward compatibility
    const reportingPageUrl = reportingPageSlug || 'about-us';
    const items = [
      { 
        label: reportingPageTitle || t('navigation.aboutUs'), 
        href: `/company/${companySlug}/${reportingPageUrl}` 
      },
    ];

    // Add dynamic pages from backend (only active ones are returned by the API)
    navigationPages.forEach((page) => {
      // Use page_slug if available, otherwise fallback to route
      const pageUrl = page.page_slug || page.route;
      items.push({
        label: page.page_title || '',
        href: `/company/${companySlug}/${pageUrl}`,
      });
    });

    return items;
  }, [routeSlug, company.slug, navigationPages, reportingPageTitle, reportingPageSlug, t]);

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleMobileDrawerClose = () => {
    setMobileDrawerOpen(false);
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          px: { xs: 2, md: 4 },
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileDrawerToggle}
            sx={{ mr: 2, color: '#6b7280' }}
          >
            <Iconify icon="solar:list-bold" />
          </IconButton>
        )}

        {/* Small Logo and Company Logo - Left side */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mr: 0, gap: 3 }}>
          {smallLogo ? (
            <Box
              component="img"
              src={smallLogo}
              alt="Site Logo"
              sx={{
                height: 20,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : siteLogo ? (
            <Box
              component="img"
              src={siteLogo}
              alt="Site Logo"
              sx={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <Box
              component="img"
              src="/logo/logo-single.png"
              alt="Wisling Logo"
              sx={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
          {/* Company Logo - Next to site logo */}
          {companyLogoUrl && (
            <Box
              component="img"
              src={companyLogoUrl}
              alt={company.name}
              sx={{
                height: 32,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
        </Box>

        {/* Navigation Links Container - with 25px left margin */}
        <Box
          style={{ marginLeft: '150px' }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            ml: '25px',
            minWidth: 0,
          }}
        >
          {/* Right Navigation Links - Hidden on Mobile */}
          {!isMobile && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Box key={item.label} sx={{ position: 'relative' }}>
                    <Button
                      color="inherit"
                      href={item.href}
                      sx={{
                        color: isActive ? '#1f2937' : '#6b7280',
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '14px',
                        textTransform: 'none',
                        px: 2,
                        py: 1,
                        position: 'relative',
                        '&:hover': {
                          color: '#1f2937',
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Right Action Buttons - Spacer to push to right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Language Selector and Logout (only on case-details pages) */}
        <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguagePopover />
          {isCaseDetailsPage && (
            <IconButton
              onClick={handleLogout}
              sx={{
                width: 40,
                height: 40,
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: 'action.hover',
                },
              }}
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#1f1f1f" style={{ width: 24, height: 24 }}><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><path d="M17,8l-1.41,1.41L17.17,11H9v2h8.17l-1.58,1.58L17,16l4-4L17,8z M5,5h7V3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h7v-2H5V5z"/></g></svg>
            </IconButton>
          )}
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: 'white',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Site Logo and Small Company Logo in Drawer (Mobile View) */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 3 }}>
            {smallLogo ? (
              <Box
                component="img"
                src={smallLogo}
                alt="Site Logo"
                sx={{
                  height: 32,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : siteLogo ? (
              <Box
                component="img"
                src={siteLogo}
                alt="Site Logo"
                sx={{
                  height: 32,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <Box
                component="img"
                src="/logo/logo-single.png"
                alt="Wisling Logo"
                sx={{
                  height: 32,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}
            {/* Company Logo - Next to site logo */}
            {companyLogoUrl && (
              <Box
                component="img"
                src={companyLogoUrl}
                alt={company.name}
                sx={{
                  height: 32,
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Navigation Links */}
          <List>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <ListItem key={item.label} disablePadding>
                  <ListItemButton
                    href={item.href}
                    onClick={handleMobileDrawerClose}
                    sx={{
                      py: 1.5,
                      px: 2,
                      borderRadius: 1,
                      mb: 0.5,
                      backgroundColor: isActive ? '#f0f9ff' : 'transparent',
                      '&:hover': {
                        backgroundColor: '#f9fafb',
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: isActive ? '#1f2937' : '#6b7280',
                          fontWeight: isActive ? 600 : 400,
                          fontSize: '14px',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Action Buttons in Drawer (Login/Create Case removed) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }} />
        </Box>
      </Drawer>
    </AppBar>
  );
}

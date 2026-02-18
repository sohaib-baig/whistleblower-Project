import type { BoxProps } from '@mui/material/Box';
import type { Breakpoint } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export type AuthSplitSectionProps = BoxProps & {
  title?: string;
  method?: string;
  imgUrl?: string;
  subtitle?: string;
  content?: string; // HTML content to display
  layoutQuery?: Breakpoint;
  methods?: {
    path: string;
    icon: string;
    label: string;
  }[];
};

export function AuthSplitSection({
  sx,
  method,
  methods,
  layoutQuery = 'md',
  title = 'Manage the job',
  imgUrl = `${CONFIG.assetsDir}/assets/illustrations/illustration-dashboard.webp`,
  subtitle = 'More effectively with optimized workflows.',
  content,
  ...other
}: AuthSplitSectionProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          ...theme.mixins.bgGradient({
            images: [
              `linear-gradient(0deg, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.92)}, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.92)})`,
              `url(${CONFIG.assetsDir}/assets/background/background-3-blur.webp)`,
            ],
          }),
          px: 3,
          pb: 3,
          width: 1,
          maxWidth: 480,
          display: 'none',
          position: 'relative',
          pt: 'var(--layout-header-desktop-height)',
          [theme.breakpoints.up(layoutQuery)]: {
            gap: 3,
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            height: '100vh',
            overflow: 'hidden',
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {content ? (
        <Box
          sx={{
            width: 1,
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            pr: 2,
            // Custom scrollbar styling
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: (theme) => theme.palette.grey[400],
              borderRadius: '4px',
              '&:hover': {
                background: (theme) => theme.palette.grey[500],
              },
            },
            // Content styling
            '& h1, & h2, & h3': {
              textAlign: 'left',
              mb: 2,
              mt: 2,
            },
            '& h1': {
              fontSize: '2rem',
              fontWeight: 600,
            },
            '& h2': {
              fontSize: '1.5rem',
              fontWeight: 500,
            },
            '& h3': {
              fontSize: '1.25rem',
              fontWeight: 500,
            },
            '& p': {
              color: 'text.secondary',
              textAlign: 'left',
              mb: 1.5,
            },
            '& ul, & ol': {
              color: 'text.secondary',
              textAlign: 'left',
              px: 2,
            },
            '& li': {
              mb: 1,
            },
            '& img': {
              width: 1,
              maxWidth: 1,
              aspectRatio: '4/3',
              objectFit: 'cover',
              borderRadius: 2,
              mt: 3,
              mb: 3,
            },
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div>
          <Typography variant="h3" sx={{ textAlign: 'center' }}>
            {title}
          </Typography>

          {subtitle && (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
              {subtitle}
            </Typography>
          )}
        </div>
      )}

      {!!methods?.length && method && (
        <Box component="ul" sx={{ gap: 2, display: 'flex' }}>
          {methods.map((option) => {
            const selected = method === option.label.toLowerCase();

            return (
              <Box
                key={option.label}
                component="li"
                sx={{
                  ...(!selected && {
                    cursor: 'not-allowed',
                    filter: 'grayscale(1)',
                  }),
                }}
              >
                <Tooltip title={option.label} placement="top">
                  <Link
                    component={RouterLink}
                    href={option.path}
                    sx={{ ...(!selected && { pointerEvents: 'none' }) }}
                  >
                    <Box
                      component="img"
                      alt={option.label}
                      src={option.icon}
                      sx={{ width: 32, height: 32 }}
                    />
                  </Link>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

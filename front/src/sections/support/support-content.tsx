import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

// ----------------------------------------------------------------------

type Props = {
  content: string;
};

export function SupportContent({ content }: Props) {
  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 2,
        boxShadow: (theme) => theme.customShadows.z1,
      }}
    >
      <Box
        sx={{
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            color: 'text.primary',
            fontWeight: 600,
            mb: 2,
            mt: 3,
            '&:first-of-type': {
              mt: 0,
            },
          },
          '& h1': {
            fontSize: { xs: '1.5rem', md: '2rem' },
            mb: 3,
          },
          '& h2': {
            fontSize: { xs: '1.25rem', md: '1.5rem' },
          },
          '& h3': {
            fontSize: { xs: '1.125rem', md: '1.25rem' },
          },
          '& p': {
            color: 'text.secondary',
            lineHeight: 1.7,
            mb: 2,
          },
          '& ul, & ol': {
            pl: 3,
            mb: 2,
            '& li': {
              color: 'text.secondary',
              lineHeight: 1.7,
              mb: 0.5,
            },
          },
          '& strong': {
            fontWeight: 600,
            color: 'text.primary',
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 1,
            my: 2,
          },
          '& blockquote': {
            borderLeft: 4,
            borderColor: 'primary.main',
            pl: 2,
            py: 1,
            my: 2,
            backgroundColor: 'grey.50',
            fontStyle: 'italic',
          },
          '& code': {
            backgroundColor: 'grey.100',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.875em',
            fontFamily: 'monospace',
          },
          '& pre': {
            backgroundColor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            '& code': {
              backgroundColor: 'transparent',
              p: 0,
            },
          },
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            mb: 2,
            '& th, & td': {
              border: 1,
              borderColor: 'divider',
              p: 1,
              textAlign: 'left',
            },
            '& th': {
              backgroundColor: 'grey.50',
              fontWeight: 600,
            },
          },
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </Paper>
  );
}

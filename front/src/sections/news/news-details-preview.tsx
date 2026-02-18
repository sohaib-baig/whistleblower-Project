import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogActions from '@mui/material/DialogActions';

import { Markdown } from 'src/components/markdown';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

import { NewsDetailsHero } from './news-details-hero';

// ----------------------------------------------------------------------

type Props = {
  title: string;
  open: boolean;
  content: string;
  isValid: boolean;
  description: string;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  coverUrl?: string | File | null;
};

export function NewsDetailsPreview({
  open,
  title,
  content,
  isValid,
  onClose,
  coverUrl,
  onSubmit,
  description,
  isSubmitting,
}: Props) {
  const hasHero = title || coverUrl;
  const hasContent = title || description || content || coverUrl;

  return (
    <Dialog fullScreen open={open} aria-hidden={!open} onClose={onClose}>
      <DialogActions sx={{ py: 2, px: 3 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Preview
        </Typography>

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>

        <Button
          type="submit"
          variant="contained"
          disabled={!isValid}
          loading={isSubmitting}
          onClick={onSubmit}
        >
          News
        </Button>
      </DialogActions>

      <Divider />

      {hasContent ? (
        <Scrollbar>
          {hasHero && <NewsDetailsHero title={title} coverUrl={coverUrl || null} />}

          <Container sx={{ mt: 5, mb: 10 }}>
            <Box sx={{ mx: 'auto', maxWidth: 720 }}>
              <Typography variant="h6">{description}</Typography>
              <Markdown>{content}</Markdown>
            </Box>
          </Container>
        </Scrollbar>
      ) : (
        <EmptyContent filled title="Empty content!" />
      )}
    </Dialog>
  );
}

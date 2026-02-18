import type { Editor } from '@tiptap/react';
import type { EditorToolbarItemProps } from '../types';

import { useState, useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { editorClasses } from '../classes';
import { ToolbarItem } from './toolbar-item';

// ----------------------------------------------------------------------

type HtmlBlockProps = {
  editor: Editor;
  icon: EditorToolbarItemProps['icon'];
};

export function HtmlBlock({ editor, icon }: HtmlBlockProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const { anchorEl, open, onOpen, onClose } = usePopover();

  const handleOpenPopover = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onOpen(event);
      setHtmlContent('');
    },
    [onOpen]
  );

  const handleApply = useCallback(() => {
    if (htmlContent.trim()) {
      // Insert HTML content at cursor position
      editor.chain().focus().insertContent(htmlContent).run();
    }
    onClose();
    setHtmlContent('');
  }, [editor, htmlContent, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
    setHtmlContent('');
  }, [onClose]);

  const popoverId = open ? 'html-popover' : undefined;

  return (
    <>
      <ToolbarItem
        aria-describedby={popoverId}
        aria-label="Insert HTML"
        className={editorClasses.toolbar.html}
        onClick={handleOpenPopover}
        icon={icon}
      />

      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={handleCancel}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 2.5,
              gap: 1.25,
              width: 1,
              maxWidth: 500,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Typography variant="subtitle2">Insert HTML Code</Typography>

        <TextField
          fullWidth
          multiline
          rows={6}
          size="small"
          placeholder="Enter your HTML code here..."
          value={htmlContent}
          onChange={(event) => setHtmlContent(event.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
          }}
        />

        <Box sx={{ gap: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={!htmlContent.trim()}
            onClick={handleApply}
          >
            Insert HTML
          </Button>
        </Box>
      </Popover>
    </>
  );
}
















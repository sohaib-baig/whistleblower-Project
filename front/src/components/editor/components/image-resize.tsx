import type { Editor } from '@tiptap/react';

import { usePopover } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';

// ----------------------------------------------------------------------

type ImageResizeProps = {
  editor: Editor;
  node: any;
  updateAttributes?: (attrs: any) => void;
  getPos?: () => number | undefined;
};

export function ImageResize({ editor, node, updateAttributes, getPos }: ImageResizeProps) {
  const { anchorEl, open, onOpen, onClose } = usePopover();

  // Initialize with current node attributes or defaults
  const [width, setWidth] = useState(node?.attrs?.width || 300);
  const [height, setHeight] = useState(node?.attrs?.height || 200);
  const [aspectRatio, setAspectRatio] = useState(true);

  // Update state when node changes or when popover opens
  useEffect(() => {
    if (open && node?.attrs) {
      setWidth(node.attrs.width || 300);
      setHeight(node.attrs.height || 200);
    }
  }, [open, node]);

  const handleWidthChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const newWidth = newValue as number;
      setWidth(newWidth);

      if (aspectRatio) {
        const currentHeight = height;
        const currentWidth = width;
        const ratio = currentHeight / currentWidth;
        setHeight(Math.round(newWidth * ratio));
      }
    },
    [width, height, aspectRatio]
  );

  const handleHeightChange = useCallback(
    (_: Event, newValue: number | number[]) => {
      const newHeight = newValue as number;
      setHeight(newHeight);

      if (aspectRatio) {
        const currentHeight = height;
        const currentWidth = width;
        const ratio = currentWidth / currentHeight;
        setWidth(Math.round(newHeight * ratio));
      }
    },
    [width, height, aspectRatio]
  );

  const handleApply = useCallback(() => {
    if (!editor) {
      console.error('Editor is not available');
      onClose();
      return;
    }

    const attrs = {
      width: width || null,
      height: height || null,
    };


    // Method 1: Use getPos to get the exact node position (most reliable)
    const pos = getPos?.();
    if (pos !== undefined && pos !== null && typeof pos === 'number') {
      try {
        const result = editor
          .chain()
          .focus()
          .setNodeSelection(pos)
          .updateAttributes('image', attrs)
          .run();
        if (result) {
          onClose();
          return;
        }
      } catch (error) {
        console.warn('setNodeSelection failed, trying fallback:', error);
      }
    }

    // Method 2: Try to use updateAttributes if available (direct from ReactNodeView)
    if (updateAttributes && typeof updateAttributes === 'function') {
      try {
        updateAttributes(attrs);
        // Force editor to update
        editor.view.dispatch(editor.state.tr);
        onClose();
        return;
      } catch (error) {
        console.warn('updateAttributes failed, trying fallback:', error);
      }
    }

    // Method 3: Find node by src attribute and update via transaction (most reliable fallback)
    if (node?.attrs?.src) {
      try {
        const { state, view } = editor;
        const tr = state.tr;
        const targetSrc = node.attrs.src;
        let updated = false;
        let nodePos: number | null = null;
        
        state.doc.descendants((n, p) => {
          if (n?.type?.name === 'image' && n?.attrs?.src === targetSrc) {
            nodePos = p;
            // Create new attributes object
            const newAttrs = {
              ...n.attrs,
              width: attrs.width,
              height: attrs.height,
            };
            tr.setNodeMarkup(p, undefined, newAttrs);
            updated = true;
            return false;
          }
          return true;
        });
        
        if (updated && nodePos !== null) {
          view.dispatch(tr);
          onClose();
          return;
        }
        console.warn('Image node not found in document or update failed');
      } catch (error) {
        console.error('Transaction update failed:', error);
      }
    }

    // Method 4: Last resort - try to update via command chain
    try {
      editor
        .chain()
        .focus()
        .command(({ tr, state }) => {
          const { doc } = state;
          const targetSrc = node?.attrs?.src;
          let updated = false;
          
          if (targetSrc) {
            doc.descendants((n, p) => {
              if (n?.type?.name === 'image' && n?.attrs?.src === targetSrc) {
                tr.setNodeMarkup(p, undefined, {
                  ...n.attrs,
                  width: attrs.width,
                  height: attrs.height,
                });
                updated = true;
                return false;
              }
              return true;
            });
          }
          
          return updated;
        })
        .run();
      onClose();
    } catch (error) {
      console.error('Command chain failed:', error);
      onClose();
    }
  }, [width, height, updateAttributes, editor, node, getPos, onClose]);

  const handleReset = useCallback(() => {
    // Reset to original image dimensions if available, otherwise use defaults
    const originalWidth = node?.attrs?.width || 300;
    const originalHeight = node?.attrs?.height || 200;
    setWidth(originalWidth);
    setHeight(originalHeight);
  }, [node]);

  const popoverId = open ? 'image-resize-popover' : undefined;

  return (
    <>
      <Button variant="outlined" size="small" onClick={onOpen} sx={{ minWidth: 100 }}>
        Resize Image
      </Button>

      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 3,
              gap: 2,
              width: 1,
              maxWidth: 400,
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Resize Image
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Width: {width}px
          </Typography>
          <Slider
            value={width}
            onChange={handleWidthChange}
            min={50}
            max={800}
            step={10}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}px`}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Height: {height}px
          </Typography>
          <Slider
            value={height}
            onChange={handleHeightChange}
            min={50}
            max={600}
            step={10}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}px`}
          />
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Aspect Ratio</InputLabel>
          <Select
            value={aspectRatio ? 'true' : 'false'}
            onChange={(e) => setAspectRatio(e.target.value === 'true')}
            label="Aspect Ratio"
          >
            <MenuItem value="true">Maintain Aspect Ratio</MenuItem>
            <MenuItem value="false">Free Resize</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleApply}>
            Apply
          </Button>
        </Box>
      </Popover>
    </>
  );
}

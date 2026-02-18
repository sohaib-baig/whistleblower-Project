import type { Editor } from '@tiptap/react';
import type { EditorToolbarItemProps } from '../types';

import { usePopover } from 'minimal-shared/hooks';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { editorClasses } from '../classes';
import { ToolbarItem } from './toolbar-item';

// ----------------------------------------------------------------------

type ImageUploadBlockProps = Pick<EditorToolbarItemProps, 'icon'> & {
  editor: Editor;
};

type ImageFormState = {
  imageUrl: string;
  altText: string;
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
};

export function ImageUploadBlock({ editor, icon }: ImageUploadBlockProps) {
  const { anchorEl, open, onOpen, onClose } = usePopover();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ImageFormState>({
    imageUrl: '',
    altText: '',
    file: null,
    isUploading: false,
    uploadProgress: 0,
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setState((prev) => ({ ...prev, file, imageUrl: '' }));
    }
  }, []);

  const handleUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, imageUrl: event.target.value, file: null }));
  }, []);

  const handleAltTextChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, altText: event.target.value }));
  }, []);

  const simulateFileUpload = useCallback(
    async (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        try {
          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
            }
            setState((prev) => ({ ...prev, uploadProgress: progress }));
          }, 100);

          // Simulate upload completion after 2 seconds
          setTimeout(() => {
            try {
              // In a real application, you would upload the file to your server
              // and get back a URL. For now, we'll create a data URL.
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result as string;
                if (result) {
                  resolve(result);
                } else {
                  reject(new Error('Failed to read file'));
                }
              };
              reader.onerror = () => reject(new Error('File reading failed'));
              reader.readAsDataURL(file);
            } catch (error) {
              reject(error);
            }
          }, 2000);
        } catch (error) {
          reject(error);
        }
      }),
    []
  );

  const handleApply = useCallback(async () => {
    if (!state.imageUrl && !state.file) {
      alert('Please provide either an image URL or select a file');
      return;
    }

    setState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      let finalUrl = state.imageUrl;

      if (state.file) {
        finalUrl = await simulateFileUpload(state.file);
      }

      // Insert image into editor
      editor
        .chain()
        .focus()
        .setImage({
          src: finalUrl,
          alt: state.altText || 'Uploaded image',
        })
        .run();

      // Reset form
      setState({
        imageUrl: '',
        altText: '',
        file: null,
        isUploading: false,
        uploadProgress: 0,
      });

      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setState((prev) => ({ ...prev, isUploading: false, uploadProgress: 0 }));
    }
  }, [editor, state.imageUrl, state.file, state.altText, onClose, simulateFileUpload]);

  const handleCancel = useCallback(() => {
    setState({
      imageUrl: '',
      altText: '',
      file: null,
      isUploading: false,
      uploadProgress: 0,
    });
    onClose();
  }, [onClose]);

  const popoverId = open ? 'image-upload-popover' : undefined;

  return (
    <>
      <ToolbarItem
        aria-describedby={popoverId}
        aria-label="Insert image"
        className={editorClasses.toolbar.image}
        onClick={onOpen}
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
        <Typography variant="h6" sx={{ mb: 1 }}>
          Add Image
        </Typography>

        {/* File Upload Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Upload Image File
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            disabled={state.isUploading}
            sx={{ mb: 1 }}
          >
            {state.file ? state.file.name : 'Choose File'}
          </Button>
          {state.file && (
            <Typography variant="caption" color="text.secondary">
              File: {state.file.name} ({(state.file.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          OR
        </Typography>

        {/* URL Input Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Image URL
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="https://example.com/image.jpg"
            value={state.imageUrl}
            onChange={handleUrlChange}
            disabled={state.isUploading || !!state.file}
          />
        </Box>

        {/* Alt Text */}
        <TextField
          fullWidth
          size="small"
          label="Alt text"
          placeholder="Describe the image for accessibility"
          value={state.altText}
          onChange={handleAltTextChange}
          disabled={state.isUploading}
        />

        {/* Upload Progress */}
        {state.isUploading && (
          <Box sx={{ width: '100%' }}>
            <Typography variant="caption" color="text.secondary">
              Uploading... {Math.round(state.uploadProgress)}%
            </Typography>
            <LinearProgress variant="determinate" value={state.uploadProgress} sx={{ mt: 0.5 }} />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={state.isUploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={(!state.imageUrl && !state.file) || state.isUploading}
          >
            {state.isUploading ? 'Uploading...' : 'Apply'}
          </Button>
        </Box>
      </Popover>
    </>
  );
}

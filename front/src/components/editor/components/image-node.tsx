import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type ReactNodeViewProps } from '@tiptap/react';

import { ImageResize } from './image-resize';

// ----------------------------------------------------------------------

export interface ImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        height?: number;
      }) => ReturnType;
    };
  }
}

export const ImageNode = Node.create<ImageOptions>({
  name: 'image',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute('style'),
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {};
          }
          return {
            style: attributes.style,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView: () => ReactNodeViewRenderer(ImageNodeView),

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: options,
          }),
    };
  },
});

// ----------------------------------------------------------------------

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

function ImageNodeView(props: ReactNodeViewProps) {
  const { node, updateAttributes, deleteNode, getPos } = props;
  
  const [showResize, setShowResize] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const { src, alt, title, width, height, style } = node.attrs;

  const handleImageClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setIsSelected(true);
  }, []);

  const handleResizeClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setShowResize(true);
  }, []);

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      deleteNode();
    },
    [deleteNode]
  );

  return (
    <Box
      component="span"
      sx={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
        '&:hover .image-controls': {
          opacity: 1,
        },
      }}
      onClick={handleImageClick}
    >
      <img
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        style={{
          maxWidth: '100%',
          // Only use height: auto if height attribute is not set
          height: height ? undefined : 'auto',
          borderRadius: 4,
          border: isSelected ? '2px solid #1976d2' : '2px solid transparent',
          ...(style ? (() => {
            // Parse style string into object
            const styleObj: Record<string, string> = {};
            if (typeof style === 'string') {
              style.split(';').forEach((rule) => {
                const [key, value] = rule.split(':').map((s) => s.trim());
                if (key && value) {
                  styleObj[key] = value;
                }
              });
            }
            return styleObj;
          })() : {}),
        }}
      />

      {/* Image Controls */}
      <Box
        className="image-controls"
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          display: 'flex',
          gap: 0.5,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.2s',
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 2,
          p: 0.5,
        }}
      >
        <IconButton
          size="small"
          onClick={handleResizeClick}
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <Iconify icon="solar:pen-bold" />
        </IconButton>

        <IconButton
          size="small"
          onClick={handleDeleteClick}
          sx={{
            backgroundColor: 'error.main',
            color: 'error.contrastText',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
        </IconButton>
      </Box>

      {/* Resize Dialog */}
      {showResize && (
        <ImageResize 
          editor={props.editor} 
          node={node} 
          updateAttributes={updateAttributes}
          getPos={getPos}
        />
      )}
    </Box>
  );
}

import type { Editor } from '@tiptap/react';

import { useEditorState } from '@tiptap/react';

import { editorClasses } from '../classes';
import { ToolbarItem } from './toolbar-item';
import { toolbarIcons } from './toolbar-icons';

// ----------------------------------------------------------------------

type ImageAlignButtonProps = {
  editor: Editor;
  align: 'left' | 'center' | 'right';
  hideWhenUnavailable?: boolean;
  showShortcut?: boolean;
  onAligned?: () => void;
};

export function ImageAlignButton({ 
  editor, 
  align, 
  hideWhenUnavailable = true,
  showShortcut = false,
  onAligned 
}: ImageAlignButtonProps) {
  const imageState = useEditorState({
    editor,
    selector: (ctx) => {
      const { state } = ctx.editor;
      const { selection } = state;
      
      // Check if an image node is selected
      let imageNode = null;
      let imageStyle = '';
      
      // Check if image is active
      const isImageActive = ctx.editor.isActive('image');
      
      if (isImageActive) {
        // Try to find the image node
        const { $anchor } = selection;
        const node = $anchor.node();
        
        if (node?.type?.name === 'image') {
          imageNode = node;
          imageStyle = node.attrs?.style || '';
        } else {
          // Search for image in the document near selection
          const pos = $anchor.pos;
          state.doc.nodesBetween(
            Math.max(0, pos - 10),
            Math.min(state.doc.content.size, pos + 10),
            (n) => {
              if (n.type.name === 'image') {
                imageNode = n;
                imageStyle = n.attrs?.style || '';
                return false; // Stop searching
              }
              return true;
            }
          );
        }
      }
      
      return {
        isImageSelected: !!imageNode,
        currentStyle: imageStyle,
      };
    },
  });

  const isImageSelected = imageState?.isImageSelected || false;
  const imageCurrentStyle = imageState?.currentStyle || '';

  const isActive = useEditorState({
    editor,
    selector: (ctx) => {
      if (!isImageSelected) {
        return false;
      }
      
      const style = imageCurrentStyle || '';
      
      if (align === 'left') {
        return style.includes('float: left') || (!style && align === 'left');
      }
      if (align === 'center') {
        return style.includes('margin: 0 auto') || style.includes('display: block; margin: 0 auto');
      }
      if (align === 'right') {
        return style.includes('float: right');
      }
      
      return false;
    },
  });

  const handleClick = () => {
    if (!editor || !isImageSelected) {
      return;
    }

    const { state } = editor;
    const { selection } = state;
    
    // Find the image node
    let imageNode = null;
    let nodePos: number | null = null;
    
    const { $anchor } = selection;
    const node = $anchor.node();
    
    if (node?.type?.name === 'image') {
      imageNode = node;
      nodePos = $anchor.before();
    } else {
      // Search for image node in the document
      state.doc.descendants((n, pos) => {
        if (n.type.name === 'image' && pos >= selection.from && pos <= selection.to) {
          imageNode = n;
          nodePos = pos;
          return false;
        }
        return true;
      });
    }

    if (!imageNode) {
      return;
    }

    const imageStyle = imageNode.attrs?.style || '';
    
    // Remove existing alignment styles
    const cleanedStyle = imageStyle
      .replace(/float:\s*(left|right|none);?/gi, '')
      .replace(/text-align:\s*(left|center|right|justify);?/gi, '')
      .replace(/margin:\s*[^;]+;?/gi, '')
      .replace(/display:\s*block;?/gi, '')
      .trim()
      .replace(/;\s*;/g, ';')
      .replace(/^;|;$/g, '');

    // Apply new alignment
    let newStyle = '';
    if (align === 'left') {
      newStyle = cleanedStyle ? `${cleanedStyle}; float: left;` : 'float: left;';
    } else if (align === 'center') {
      newStyle = cleanedStyle ? `${cleanedStyle}; display: block; margin: 0 auto;` : 'display: block; margin: 0 auto;';
    } else if (align === 'right') {
      newStyle = cleanedStyle ? `${cleanedStyle}; float: right;` : 'float: right;';
    }

    // Update the image node using transaction
    const { tr } = state;
    if (nodePos !== null) {
      tr.setNodeMarkup(nodePos, undefined, {
        ...imageNode.attrs,
        style: newStyle,
      });
      editor.view.dispatch(tr);
    } else {
      // Fallback: use updateAttributes command
      editor
        .chain()
        .focus()
        .updateAttributes('image', {
          style: newStyle,
        })
        .run();
    }
    
    // Call the onAligned callback if provided
    onAligned?.();
  };

  const getAriaLabel = () => {
    const alignText = align.charAt(0).toUpperCase() + align.slice(1);
    let label = `Align image ${alignText}`;
    
    if (showShortcut) {
      // Add keyboard shortcuts based on alignment
      const shortcuts: Record<string, string> = {
        left: 'Alt+Shift+L',
        center: 'Alt+Shift+E',
        right: 'Alt+Shift+R',
      };
      label += ` (${shortcuts[align] || ''})`;
    }
    
    return label;
  };

  const getIcon = () => {
    if (align === 'left') return toolbarIcons.alignLeft;
    if (align === 'center') return toolbarIcons.alignCenter;
    if (align === 'right') return toolbarIcons.alignRight;
    return toolbarIcons.alignLeft;
  };

  if (!isImageSelected && hideWhenUnavailable) {
    return null;
  }

  return (
    <ToolbarItem
      aria-label={getAriaLabel()}
      active={isActive}
      className={editorClasses.toolbar[`align${align.charAt(0).toUpperCase() + align.slice(1)}` as keyof typeof editorClasses.toolbar]}
      onClick={handleClick}
      icon={getIcon()}
    />
  );
}


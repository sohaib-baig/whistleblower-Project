import type { EditorProps } from './types';

import { debounce } from 'es-toolkit';
import { common, createLowlight } from 'lowlight';
import { mergeClasses } from 'minimal-shared/utils';
import ImageExtension from '@tiptap/extension-image';
import StarterKitExtension from '@tiptap/starter-kit';
import TextAlignExtension from '@tiptap/extension-text-align';
import { Placeholder as PlaceholderExtension } from '@tiptap/extensions';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import CodeBlockLowlightExtension from '@tiptap/extension-code-block-lowlight';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';

import Box from '@mui/material/Box';
import Portal from '@mui/material/Portal';
import Backdrop from '@mui/material/Backdrop';
import FormHelperText from '@mui/material/FormHelperText';

import { EditorRoot } from './styles';
import { editorClasses } from './classes';
import { Toolbar } from './components/toolbar';
import { BubbleToolbar } from './components/bubble-toolbar';
import { CodeHighlightBlock } from './components/code-highlight-block';
import { ClearFormat as ClearFormatExtension } from './extension/clear-format';
import { TextTransform as TextTransformExtension } from './extension/text-transform';

// ----------------------------------------------------------------------

export function Editor({
  sx,
  error,
  onChange,
  slotProps,
  helperText,
  resetValue,
  className,
  editable = true,
  fullItem = false,
  immediatelyRender = false,
  ref: contentRef,
  value: initialContent = '',
  placeholder = 'Write something awesome...',
  ...other
}: EditorProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [rerenderKey, setRerenderKey] = useState(0);
  const lastSetContentRef = useRef<string>('');
  const isUserEditingRef = useRef(false);

  const lowlight = useMemo(() => createLowlight(common), []);

  const debouncedOnChange = useMemo(
    () =>
      debounce((html: string) => {
        onChange?.(html);
      }, 200),
    [onChange]
  );

  const editor = useEditor({
    editable,
    immediatelyRender,
    content: initialContent,
    shouldRerenderOnTransaction: !!rerenderKey,
    onUpdate: (ctx) => {
      const html = ctx.editor.getHTML();
      isUserEditingRef.current = true;
      debouncedOnChange(html);
      // Reset the flag after a short delay to allow for external updates
      setTimeout(() => {
        isUserEditingRef.current = false;
      }, 500);
    },
    onCreate: ({ editor: createdEditor }) => {
    },
    extensions: [
      StarterKitExtension.configure({
        codeBlock: false,
        code: { HTMLAttributes: { class: editorClasses.content.codeInline } },
        heading: { HTMLAttributes: { class: editorClasses.content.heading } },
        horizontalRule: { HTMLAttributes: { class: editorClasses.content.hr } },
        listItem: { HTMLAttributes: { class: editorClasses.content.listItem } },
        blockquote: { HTMLAttributes: { class: editorClasses.content.blockquote } },
        bulletList: { HTMLAttributes: { class: editorClasses.content.bulletList } },
        orderedList: { HTMLAttributes: { class: editorClasses.content.orderedList } },
        link: {
          openOnClick: false,
          HTMLAttributes: { class: editorClasses.content.link },
        },
      }),
      TextAlignExtension.configure({ types: ['heading', 'paragraph'] }),
      ImageExtension.configure({ 
        HTMLAttributes: { class: editorClasses.content.image },
        inline: false,
        allowBase64: true,
      }),
      PlaceholderExtension.configure({
        placeholder,
        emptyEditorClass: editorClasses.content.placeholder,
      }),
      CodeBlockLowlightExtension.extend({
        addNodeView: () => ReactNodeViewRenderer(CodeHighlightBlock),
      }).configure({ lowlight }),
      // Custom extensions
      TextTransformExtension,
      ClearFormatExtension,
    ],
    ...other,
  });

  const handleToggleFullscreen = useCallback(() => {
    editor?.unmount();
    setFullscreen((prev) => !prev);
    setRerenderKey((prev) => prev + 1);
  }, [editor]);

  const handleExitFullscreen = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        editor?.unmount();
        setFullscreen(false);
        setRerenderKey((prev) => prev + 1);
      }
    },
    [editor]
  );

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return undefined;
    }
    
    // Don't update if user is actively editing
    if (isUserEditingRef.current) {
      return undefined;
    }
    
    const timer = setTimeout(() => {
      const currentContent = editor.getHTML();
      // Normalize both contents for comparison (remove extra whitespace)
      const normalizedCurrent = currentContent.replace(/\s+/g, ' ').trim();
      const normalizedInitial = (initialContent || '').replace(/\s+/g, ' ').trim();
      
      // Only update if:
      // 1. Content has actually changed AND
      // 2. The new content is different from what we last set (to avoid loops) AND
      // 3. Either the editor is empty and we have new content, or the content is significantly different
      const isSignificantChange = 
        normalizedCurrent !== normalizedInitial && 
        initialContent !== lastSetContentRef.current &&
        (normalizedCurrent === '' || normalizedInitial === '' || 
         Math.abs(normalizedCurrent.length - normalizedInitial.length) > 10);
      
      if (isSignificantChange && initialContent !== undefined) {
        // Use setContent - TipTap will parse the HTML including base64 images
        editor.commands.setContent(initialContent, { emitUpdate: false });
        lastSetContentRef.current = initialContent;
      }
    }, 200);
    return () => {
      clearTimeout(timer);
    };
  }, [initialContent, editor]);

  useEffect(() => {
    if (resetValue && !initialContent) {
      editor?.commands.clearContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent]);

  useEffect(() => {
    if (!fullscreen) return undefined;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleExitFullscreen);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleExitFullscreen);
    };
  }, [fullscreen, handleExitFullscreen]);

  return (
    <Portal disablePortal={!fullscreen}>
      {fullscreen && <Backdrop open sx={[(theme) => ({ zIndex: theme.zIndex.modal - 1 })]} />}

      <Box
        {...slotProps?.wrapper}
        sx={[
          { display: 'flex', flexDirection: 'column' },
          ...(Array.isArray(slotProps?.wrapper?.sx)
            ? slotProps.wrapper.sx
            : [slotProps?.wrapper?.sx]),
        ]}
      >
        <EditorRoot
          className={mergeClasses([editorClasses.root, className], {
            [editorClasses.state.error]: !!error,
            [editorClasses.state.disabled]: !editable,
            [editorClasses.state.fullscreen]: fullscreen,
          })}
          sx={sx}
        >
          {editor && !editor.isDestroyed && (
            <>
              <Toolbar
                editor={editor}
                fullItem={fullItem}
                fullscreen={fullscreen}
                onToggleFullscreen={handleToggleFullscreen}
              />
              <BubbleToolbar editor={editor} />
              <EditorContent
                ref={contentRef}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                editor={editor}
                className={editorClasses.content.root}
              />
            </>
          )}
        </EditorRoot>

        {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
      </Box>
    </Portal>
  );
}

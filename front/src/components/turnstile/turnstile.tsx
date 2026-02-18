import { memo, useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    __turnstileLoading?: Promise<void>;
  }
}

// Singleton script loader
let scriptLoadPromise: Promise<void> | undefined = undefined;

// Global registry to track rendered widgets by container element
const widgetRegistry = new WeakMap<HTMLElement, string>();

function loadTurnstileScript(): Promise<void> {
  // Return resolved promise if Turnstile is already available
  if (window.turnstile) {
    return Promise.resolve();
  }

  // Return existing promise if script is already loading
  if (window.__turnstileLoading) {
    return window.__turnstileLoading;
  }

  // Check if script tag already exists
  const scriptId = 'cf-turnstile-script';
  const existingScript = document.getElementById(scriptId);
  
  if (existingScript) {
    // Script exists, wait for it to load with polling
    scriptLoadPromise = new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max (100 * 100ms)
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.turnstile) {
          clearInterval(checkInterval);
          window.__turnstileLoading = undefined;
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          window.__turnstileLoading = undefined;
          reject(new Error('Turnstile script failed to load after timeout'));
        }
      }, 100);
    });
    
    window.__turnstileLoading = scriptLoadPromise;
    return scriptLoadPromise;
  }

  // Create new script and load it
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    let resolved = false;
    
    const cleanup = () => {
      window.__turnstileLoading = undefined;
    };
    
    script.onload = () => {
      // Poll for Turnstile to become available (it might take a moment)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      const checkTurnstile = setInterval(() => {
        attempts++;
        
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve();
          }
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkTurnstile);
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('Turnstile object not available after script load'));
          }
        }
      }, 100);
    };

    script.onerror = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error('Failed to load Cloudflare Turnstile script'));
      }
    };

    window.__turnstileLoading = scriptLoadPromise;
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export type TurnstileProps = {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
};

// ----------------------------------------------------------------------

function TurnstileComponent({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  theme = 'auto',
  size = 'normal',
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const isRenderingRef = useRef(false);
  const hasRenderedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Memoize callbacks to prevent re-renders
  const handleSuccess = useCallback((token: string) => {
    isRenderingRef.current = false;
    onSuccess(token);
  }, [onSuccess]);
  
  const handleError = useCallback(() => {
    isRenderingRef.current = false;
    if (onError) {
      onError();
    }
  }, [onError]);
  
  const handleExpire = useCallback(() => {
    if (onExpire) {
      onExpire();
    }
  }, [onExpire]);

  useEffect(() => {
    let isMounted = true;

    // Check if already loaded
    if (window.turnstile) {
      setIsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    loadTurnstileScript()
      .then(() => {
        if (isMounted && window.turnstile) {
          setIsLoaded(true);
        } else if (isMounted) {
          if (onError) {
            onError();
          }
        }
      })
      .catch((error) => {
        console.error('[Turnstile] Script loading error:', error);
        if (isMounted && onError) {
          onError();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onError]);

  useEffect(() => {
    // Wait for container to be ready
    if (!isLoaded || !containerRef.current || !window.turnstile) {
      return () => {
        // No cleanup needed if widget wasn't rendered
      };
    }

    // Double-check container is still available
    const container = containerRef.current;
    if (!container) {
      return () => {
        // No cleanup needed
      };
    }

    // CRITICAL: Prevent multiple renders - if we've already rendered, don't do it again
    if (hasRenderedRef.current || widgetIdRef.current || isRenderingRef.current) {
      return () => {
        // No cleanup needed
      };
    }

    // Check global registry first
    const registeredWidgetId = widgetRegistry.get(container);
    if (registeredWidgetId) {
      hasRenderedRef.current = true;
      widgetIdRef.current = registeredWidgetId;
      return () => {
        // No cleanup needed
      };
    }

    // Check if container already has a Turnstile widget (DOM check)
    const existingWidget = container.querySelector('.cf-turnstile, iframe[src*="challenges.cloudflare.com"]');
    const existingWidgetId = container.getAttribute('data-turnstile-widget-id');
    
    if (existingWidget || existingWidgetId) {
      hasRenderedRef.current = true;
      if (existingWidgetId) {
        widgetIdRef.current = existingWidgetId;
        widgetRegistry.set(container, existingWidgetId);
      }
      return () => {
        // No cleanup needed
      };
    }

    // Mark as rendering and rendered
    isRenderingRef.current = true;
    hasRenderedRef.current = true;

    // Clear container before rendering
    container.innerHTML = '';

    // Small delay to ensure container is ready
    const renderTimeout = setTimeout(() => {
      if (!container || !window.turnstile) {
        isRenderingRef.current = false;
        hasRenderedRef.current = false; // Reset if failed
        return;
      }

      // Double-check we don't already have a widget
      if (widgetIdRef.current || container.querySelector('.cf-turnstile')) {
        isRenderingRef.current = false;
        return;
      }

      // Render Turnstile widget
      try {
        const widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          callback: handleSuccess,
          'error-callback': handleError,
          'expired-callback': handleExpire,
          theme,
          size,
        });

        widgetIdRef.current = widgetId;
        widgetRegistry.set(container, widgetId);
        isRenderingRef.current = false;
      } catch (error) {
        isRenderingRef.current = false;
        hasRenderedRef.current = false; // Reset on error so we can retry
        console.error('[Turnstile] Failed to render widget:', error);
        if (onError) {
          onError();
        }
      }
    }, 50);

    // Cleanup function
    return () => {
      clearTimeout(renderTimeout);
      isRenderingRef.current = false;
      // Note: We don't remove from registry on cleanup to prevent re-renders
      // The registry will be cleared when the page unloads
    };
  }, [isLoaded, siteKey, handleSuccess, handleError, handleExpire, theme, size, onError]);

  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch (error) {
        console.error('Failed to reset Turnstile widget:', error);
      }
    }
  };

  // Expose reset method via ref (if needed)
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).resetTurnstile = reset;
    }
  }, []);

  // Set data attribute when widget is rendered
  useEffect(() => {
    if (containerRef.current && widgetIdRef.current) {
      containerRef.current.setAttribute('data-turnstile-widget-id', widgetIdRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetIdRef.current]);

  return (
    <Box
      ref={containerRef}
      className={className}
      data-turnstile-container="true"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 65, // Minimum height to prevent layout shift
        alignItems: 'center',
        '& .cf-turnstile': {
          margin: '0 auto',
        },
      }}
    >
      {!isLoaded && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          Loading security verification...
        </Box>
      )}
    </Box>
  );
}

// Memoize component to prevent unnecessary re-renders
export const Turnstile = memo(TurnstileComponent);


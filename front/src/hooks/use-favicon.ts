import { useEffect } from 'react';

import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';

/**
 * Hook to dynamically set the favicon from the small company logo
 */
export function useFavicon() {
  useEffect(() => {
    const setFavicon = async () => {
      try {
        // Use public endpoint to get small logo (no auth required)
        const res = await axios.get(endpoints.public.smallLogo.get);
        const data: any = res.data || {};
        const smallLogo = data?.data?.small_logo ?? data?.small_logo;
        
        if (smallLogo) {
          // Remove existing favicon links
          const existingLinks = document.querySelectorAll('link[rel*="icon"]');
          existingLinks.forEach((link) => link.remove());

          // Create new favicon link
          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          
          // Use the small logo URL directly
          // If it's already a full URL, use it as-is
          // Otherwise, construct the full URL
          let faviconUrl = smallLogo;
          if (faviconUrl.startsWith('/')) {
            faviconUrl = `${CONFIG.serverUrl}${faviconUrl}`;
          } else if (!faviconUrl.startsWith('http')) {
            faviconUrl = `${CONFIG.serverUrl}/${faviconUrl}`;
          }
          
          link.href = faviconUrl;
          
          // Add to document head
          document.head.appendChild(link);
        } else {
          // Fallback to default favicon if no small logo is set
          const existingLinks = document.querySelectorAll('link[rel*="icon"]');
          existingLinks.forEach((link) => link.remove());
          
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = '/favicon.ico';
          document.head.appendChild(link);
        }
      } catch (error) {
        console.error('Error setting favicon:', error);
        // Fallback to default favicon on error
        const existingLinks = document.querySelectorAll('link[rel*="icon"]');
        existingLinks.forEach((link) => link.remove());
        
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = '/favicon.ico';
        document.head.appendChild(link);
      }
    };

    setFavicon();
  }, []);
}


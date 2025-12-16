import { useCallback, useRef } from 'react';

/**
 * Hook to capture screenshots of the Sandpack preview iframe.
 * Uses html2canvas for cross-origin compatible screenshot capture.
 */
export function usePreviewScreenshot() {
  const isCapturing = useRef(false);

  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    if (isCapturing.current) return null;
    isCapturing.current = true;

    try {
      // Dynamically import html2canvas to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;

      // Find the Sandpack iframe
      const iframe = document.querySelector(
        'iframe[title="Sandpack Preview"]'
      ) as HTMLIFrameElement;

      if (!iframe) {
        console.warn('Sandpack iframe not found');
        return null;
      }

      // Try to access iframe content
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc || !iframeDoc.body) {
          console.warn('Cannot access iframe document');
          return null;
        }

        const canvas = await html2canvas(iframeDoc.body, {
          useCORS: true,
          allowTaint: true,
          width: 800,
          height: 600,
          scale: 1,
          logging: false,
          backgroundColor: '#0a0a0f',
        });

        return canvas.toDataURL('image/png');
      } catch (e) {
        // Cross-origin restriction - fall back to capturing the iframe element itself
        console.warn('Cross-origin iframe, falling back to element capture');
        
        // Capture the iframe's parent container instead
        const previewContainer = iframe.parentElement;
        if (previewContainer) {
          const canvas = await html2canvas(previewContainer, {
            useCORS: true,
            allowTaint: true,
            width: 800,
            height: 600,
            scale: 1,
            logging: false,
          });
          return canvas.toDataURL('image/png');
        }
        return null;
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    } finally {
      isCapturing.current = false;
    }
  }, []);

  return { captureScreenshot };
}

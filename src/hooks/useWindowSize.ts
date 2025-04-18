import { useState, useEffect } from 'react';

/**
 * Interface for the window size object
 */
interface WindowSize {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

/**
 * Hook to track window dimensions
 * - Provides current window width and height
 * - Includes responsive breakpoints (mobile, tablet, desktop)
 * - Updates on window resize
 */
export function useWindowSize(): WindowSize {
    // Define breakpoints for responsive design
    const MOBILE_BREAKPOINT = 640;  // Matches Tailwind's 'sm'
    const TABLET_BREAKPOINT = 1024; // Matches Tailwind's 'lg'

    // Initialize with default values (prefer server-rendering safe defaults)
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
    });

    useEffect(() => {
        // Only run on the client side
        if (typeof window === 'undefined') return;

        // Handler to call on window resize
        function handleResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Update responsive breakpoints
            setWindowSize({
                width,
                height,
                isMobile: width < MOBILE_BREAKPOINT,
                isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
                isDesktop: width >= TABLET_BREAKPOINT,
            });
        }

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return windowSize;
} 
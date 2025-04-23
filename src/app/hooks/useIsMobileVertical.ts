import { useEffect, useState } from 'react';

type Orientation = 'portrait' | 'landscape';

const useIsMobileVertical = (): boolean => {
  const getOrientation = (): Orientation => {
    if (typeof window === 'undefined') return 'portrait';
    return window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait';
  };

  const [orientation, setOrientation] = useState<Orientation>(getOrientation);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(orientation: landscape)');

    const handleChange = (event: MediaQueryListEvent) => {
      setOrientation(event.matches ? 'landscape' : 'portrait');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange); // Safari fallback
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return orientation !== 'landscape';
};

export default useIsMobileVertical;

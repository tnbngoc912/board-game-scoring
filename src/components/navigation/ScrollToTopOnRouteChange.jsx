'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [pathname]);

  return <></>;
}

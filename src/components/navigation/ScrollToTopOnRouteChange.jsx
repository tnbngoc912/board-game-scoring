'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    window.scroll(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll('.screen').forEach((node) => {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    });
  }, [pathname]);

  return <></>;
}

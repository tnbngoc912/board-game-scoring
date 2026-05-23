'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useEffect(() => window.scroll(0, 0), [pathname]);

  return null;
}

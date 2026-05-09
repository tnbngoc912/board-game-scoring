import { Barlow_Semi_Condensed } from 'next/font/google'
import '../index.css'

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  // variable: '--font-barlow',
})

export const metadata = {
  title: 'ScoreKeeper',
  description: 'Board game score tracker',
  applicationName: 'ScoreKeeper',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport = {
  themeColor: '#f5eedf',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={barlow.variable} suppressHydrationWarning>
      <body className={barlow.className} suppressHydrationWarning>{children}</body>
    </html>
  )
}

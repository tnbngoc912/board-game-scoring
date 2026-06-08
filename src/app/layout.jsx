import { Barlow_Semi_Condensed } from 'next/font/google'
import '../index.css'
import { ScrollToTopOnRouteChange } from '../components/navigation/ScrollToTopOnRouteChange'

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  // variable: '--font-barlow',
})

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'ScoreKeeper',
  description: 'Board game score tracker',
  applicationName: 'ScoreKeeper',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'ScoreKeeper',
    description: 'Board game score tracker',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 1200,
        alt: 'BGScore - Board Game Score Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScoreKeeper',
    description: 'Board game score tracker',
    images: ['/og-image.png'],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f5eedf',
  minimumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={barlow.variable} suppressHydrationWarning>
      <ScrollToTopOnRouteChange />
      <body className={barlow.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

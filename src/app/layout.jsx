import { Barlow_Semi_Condensed } from 'next/font/google'
import '../index.css'
import { ScrollToTopOnRouteChange } from '../components/navigation/ScrollToTopOnRouteChange'

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  // variable: '--font-barlow',
})

const appUrl = process.env.NODE_ENV === 'development'
  ? 'https://board-game-scoring.vercel.app/'
  : `https://board-game-scoring.vercel.app/`

export const metadata = {
  metadataBase: new URL(appUrl),
  title: 'ScoreKeeper',
  description: 'Board game score tracker',
  applicationName: 'ScoreKeeper',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ScoreKeeper',
    description: 'Board game score tracker',
    type: 'website',
    url: appUrl,
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

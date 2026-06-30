import { Barlow_Semi_Condensed } from 'next/font/google'
import '../index.css'
import { ScrollRestorer } from '../components/navigation/ScrollRestorer'
import { FcmForegroundListener } from '../components/notifications/FcmForegroundListener'
import { IosInstallPrompt } from '../components/IosInstallPrompt'

const barlow = Barlow_Semi_Condensed({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  // variable: '--font-barlow',
})

const appUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

export const metadata = {
    metadataBase: new URL(appUrl),
    title: "BG Score",
    description: "Ứng dụng lưu điểm BoardGame",
    applicationName: "BGScore",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: "/favicon.svg",
        apple: "/apple-touch-icon.png",
    },
    openGraph: {
        title: "BG Score",
        description: "Ứng dụng lưu điểm BoardGame",
        type: "website",
        url: appUrl,
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 1200,
                alt: "Ứng dụng lưu điểm BoardGame",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "BG Score",
        description: "Ứng dụng lưu điểm BoardGame",
        images: ["/og-image.png"],
    },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f5eedf',
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={barlow.variable} suppressHydrationWarning>
      <ScrollRestorer />
      <body className={barlow.className} suppressHydrationWarning>
        <FcmForegroundListener />
        {children}
        <IosInstallPrompt />
      </body>
    </html>
  )
}





import { Inter, Outfit, Playfair_Display } from 'next/font/google'
import './globals.css'
import { constructMetadata } from '../lib/metadata'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata = constructMetadata()

import { Toaster } from '../components/ui/Toaster'
import { AuthInit } from '../components/AuthInit'
import ScrollReset from '../components/layout/ScrollReset'
import { SwRegister } from './SwRegister'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#B91C1C" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }

                const theme = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (theme === 'dark' || (!theme && systemDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                console.error('Theme initialization error:', e);
              }
            })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${playfair.variable} font-sans antialiased overflow-x-hidden`}>
        <AuthInit />
        <ScrollReset />
        {children}
        <Toaster />
        <SwRegister site="pusat" />
      </body>
    </html>
  )
}

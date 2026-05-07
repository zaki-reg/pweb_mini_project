import type { Metadata } from 'next'
import { Manrope, Roboto_Serif, Roboto_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const robotoSerif = Roboto_Serif({
  subsets: ['latin'],
  variable: '--font-roboto-serif',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quiz Platform',
  description: 'Take quizzes and test your knowledge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${robotoSerif.variable} ${robotoMono.variable}`}>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
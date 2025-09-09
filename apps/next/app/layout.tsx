import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Random Coffee - Connect with Professionals',
  description: 'Meet interesting professionals in your field over coffee. Intelligent matching, easy scheduling, built for meaningful connections.',
  keywords: 'networking, professionals, coffee, meetings, career, telegram',
  authors: [{ name: 'Random Coffee Team' }],
  openGraph: {
    title: 'Random Coffee - Connect with Professionals',
    description: 'Meet interesting professionals in your field over coffee.',
    url: 'https://randomcoffee.bot',
    siteName: 'Random Coffee',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Random Coffee - Connect with Professionals',
    description: 'Meet interesting professionals in your field over coffee.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
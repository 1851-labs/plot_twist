import type { Metadata } from 'next';
import './globals.css';
import ConvexClientProvider from './ConvexClientProvider';
import Footer from '@/components/ui/Footer';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';

let title = 'PlotTwist - A fun, lighthearted way to share stories';
let description = 'A fun, lighthearted way to share stories';
let url = 'https:/plottwist.1851labs.com';
let ogimage = 'https://usenotesgpt.com/images/og-image.png'; // TODO: Change
let sitename = 'plottwist.1851labs.com';

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
          <Analytics />
          <Footer />
          <Toaster position="bottom-left" reverseOrder={false} />
        </ConvexClientProvider>
      </body>
    </html>
  );
}

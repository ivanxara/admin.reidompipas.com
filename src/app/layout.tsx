'use client';

import { Geist, Geist_Mono, Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/nav/app-sidebar';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import ReactQueryProvider from '@/providers/react-query';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { useGlobalStore } from '@/store/global';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/providers/theme';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getMenus, getCategories, getTags } = useGlobalStore();

  useEffect(() => {
    const fetch = async () => {
      Promise.all([getMenus(), getCategories(), getTags()]);
    };
    fetch();
  }, [getMenus, getCategories, getTags]);

  return (
    <ReactQueryProvider>
      <html lang="en" translate="no" suppressHydrationWarning>
        <body className={`${inter.className} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <NuqsAdapter>{children}</NuqsAdapter>
              </SidebarInset>
            </SidebarProvider>
            {/* <TailwindIndicator /> */}
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </ReactQueryProvider>
  );
}

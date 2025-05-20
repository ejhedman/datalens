import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavBanner } from "@/components/layout/nav-banner";
import { DataSourceProvider } from "@/components/layout/datasource-selector";
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Warehouse Documentation",
  description: "Documentation tool for data warehouse objects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full overflow-hidden`}>
        <DataSourceProvider>
          <NavBanner />
          <main className="h-[calc(100%-4rem)] bg-gray-50">
            {children}
          </main>
          <Toaster />
        </DataSourceProvider>
      </body>
    </html>
  );
}

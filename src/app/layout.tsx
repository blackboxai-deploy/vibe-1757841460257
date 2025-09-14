import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "API Monitor Pro - Request/Response Analysis Tool",
  description: "Professional API testing and monitoring application with network inspection, JavaScript evaluation, and response analysis capabilities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                  <a className="mr-6 flex items-center space-x-2" href="/">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <span className="text-sm font-bold">A</span>
                    </div>
                    <span className="font-bold sm:inline-block">API Monitor Pro</span>
                  </a>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                  <nav className="flex items-center">
                    <div className="hidden md:flex md:space-x-4">
                      <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Dashboard
                      </a>
                      <a href="#history" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        History
                      </a>
                      <a href="#settings" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Settings
                      </a>
                    </div>
                  </nav>
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
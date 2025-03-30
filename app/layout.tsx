import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { LocalStorageDebug } from "@/components/debug/LocalStorageDebug";
import { AiTestComponent } from "@/components/debug/AiTestComponent";
import { PrivyProviderWrapper } from "@/components/providers/PrivyProviderWrapper";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Productivity App",
  description: "Manage your tasks efficiently with AI power.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProviderWrapper>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow container mx-auto px-4 py-8">
                  {children}
                </main>
                <Toaster />
              </div>
              {process.env.NODE_ENV === "development" && (
                <>
                  {/* <LocalStorageDebug /> */}
                  <AiTestComponent />
                </>
              )}
            </ThemeProvider>
          </AuthProvider>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}

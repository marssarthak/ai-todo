import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { LocalStorageDebug } from "@/components/debug/LocalStorageDebug";
import { AiTestComponent } from "@/components/debug/AiTestComponent";
import { PrivyProviderWrapper } from "@/components/providers/PrivyProviderWrapper";
import { Toaster } from "sonner";
import MainLayout from "@/components/layout/MainLayout";

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
              <MainLayout>{children}</MainLayout>
              <Toaster />
            </ThemeProvider>
          </AuthProvider>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MVP",
  description: "A Next.js starter with Tailwind CSS and TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__alertQueue = window.__alertQueue || [];
              var _nativeAlert = window.alert;
              window.alert = function(msg) {
                if (typeof msg === 'string') window.__alertQueue.push(msg);
                else if (_nativeAlert) _nativeAlert.call(window, msg);
              };
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

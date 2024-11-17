import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { TopNav } from "./_components/topnav";
import { Footer } from "./_components/footer";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "sittr",
  description: "Get help with your pets",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider dynamic>
      <html lang="en" className={`${GeistSans.variable}`}>
        <body className={`${GeistSans.variable}`}>
          <Analytics />

          <div className="grid grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
            <main className="overflow-y-scroll">
              <div className="h-min min-h-dvh">
                <TopNav />
                {children}
              </div>

              <Footer />
            </main>
          </div>

          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

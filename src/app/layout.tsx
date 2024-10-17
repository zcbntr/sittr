import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { TopNav } from "./_components/topnav";
import { Footer } from "./_components/footer";

export const metadata: Metadata = {
  title: "sittr",
  description: "Everything sitting",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable}`}>
        <body className={`${GeistSans.variable}`}>
          <SignedOut>
            <div className="grid grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
              <main className="overflow-y-scroll">
                <div className="h-dvh">{children}</div>

                <Footer />
              </main>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="grid grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
              <main className="overflow-y-scroll">
                <div className="h-dvh">
                  <TopNav />
                  {children}
                </div>

                <Footer />
              </main>
            </div>
          </SignedIn>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

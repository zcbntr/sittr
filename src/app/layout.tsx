import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
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
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable}`}>
        <body className={`${GeistSans.variable}`}>
          <SignedOut>
            <div className="grid h-screen grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
              <TopNav />

              <main className="overflow-y-scroll">
                {children}
                <Footer />
              </main>
            </div>
            {modal}
            <div id="modal-root" />
            <Toaster />
          </SignedOut>
          <SignedIn>
            <div className="grid h-screen grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
              <TopNav />

              <main className="overflow-y-scroll">
                {children}

                <Footer />
              </main>
            </div>
            {modal}
            <div id="modal-root" />
            <Toaster />
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}

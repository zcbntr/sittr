import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { TopNav } from "./_components/topnav";
import { Footer } from "./_components/footer";
import { Analytics } from "@vercel/analytics/next";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: { template: "%s | Sittr", default: "Sittr" },
  description: "Invite friends and family to sit for your pets",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  applicationName: "sittr",
  referrer: "origin-when-cross-origin",
  keywords: ["Sitting", "Pet", "Dog", "Cat", "Bird", "Fish"],
  authors: [{ name: "Zac" }],
  creator: "Zac Benattar",
  publisher: "Zac Benattar",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className={`${GeistSans.variable}`}>
        <Analytics />
        <NextSSRPlugin
          /**
           * The `extractRouterConfig` will extract **only** the route configs
           * from the router to prevent additional information from being
           * leaked to the client. The data passed to the client is the same
           * as if you were to fetch `/api/uploadthing` directly.
           */
          routerConfig={extractRouterConfig(ourFileRouter)}
        />

        <div className="grid grid-rows-[auto,1fr] bg-[#f5f5f5] text-[#333]">
          <main className="overflow-y-scroll">
            <div className="h-min min-h-dvh">
              <Suspense fallback={<div>Loading...</div>}>
                <TopNav />
              </Suspense>

              {children}
            </div>

            <Footer />
          </main>
        </div>

        <Toaster />
      </body>
    </html>
  );
}

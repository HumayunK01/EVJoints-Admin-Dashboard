import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";

import { Sidebar } from "@/components/Layouts/sidebar";



import { Header } from "@/components/Layouts/header";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | EVJoints Admin",
    default: "Admin | EV Charging Station App | Electric Car Charging Stations Near Me",
  },
  description: "EVJoints Admin Dashboard",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="overflow-x-hidden" suppressHydrationWarning>
        <Providers>
          <NextTopLoader color="#22AD5C" showSpinner={false} />

          <div className="flex min-h-screen">
            <Sidebar />

            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-gray-2 dark:bg-[#020d1a]">
              <Header />

              <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-4 2xl:p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

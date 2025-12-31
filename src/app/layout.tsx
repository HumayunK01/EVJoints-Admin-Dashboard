import { Inter } from "next/font/google";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";

import { Sidebar } from "@/components/Layouts/sidebar";



import { Header } from "@/components/Layouts/header";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | EVJoints Admin",
    default: "Admin | EV Charging Station App | Electric Car Charging Stations Near Me",
  },
  description: "EVJoints Admin Dashboard",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`overflow-x-hidden ${inter.className}`} suppressHydrationWarning>
        <Providers>
          <NextTopLoader color="#22AD5C" showSpinner={false} />
          {children}
        </Providers>
      </body>
    </html>
  );
}

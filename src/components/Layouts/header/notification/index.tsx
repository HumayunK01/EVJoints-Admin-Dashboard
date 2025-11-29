"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { BellIcon } from "./icons";

export function Notification() {
  const [isDotVisible] = useState(true);

  return (
    <div
      className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none dark:border-dark-4 dark:bg-dark-3 dark:text-white"
      aria-label="Notifications"
    >
      <span className="relative">
        <BellIcon />

        {isDotVisible && (
          <span
            className={cn(
              "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
            )}
          >
            <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
          </span>
        )}
      </span>
    </div>
  );
}

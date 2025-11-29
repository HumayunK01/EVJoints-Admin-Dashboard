"use client";

import Image from "next/image";

export function UserInfo() {
  const USER = {
    name: "Admin",
    email: "admin@evjoints.com",
    img: "https://imgs.search.brave.com/0UbG4XOGV__MhzDnZciqioKm2tdIWnX_87z5lLLqMxU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4w/Lmljb25maW5kZXIu/Y29tL2RhdGEvaWNv/bnMvc2V0LXVpLWFw/cC1hbmRyb2lkLzMy/LzgtNTEyLnBuZw",
  };

  return (
    <div className="flex items-center gap-3">
      <Image
        src={USER.img}
        className="size-12"
        alt={`Avatar of ${USER.name}`}
        role="presentation"
        width={200}
        height={200}
      />
      <span className="font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
        {USER.name}
      </span>
    </div>
  );
}

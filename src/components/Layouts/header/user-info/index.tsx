"use client";

import Image from "next/image";

export function UserInfo() {
  const USER = {
    name: "Saqlain",
    email: "admin@evjoints.com",
    img: "/images/profile.jpg",
  };

  return (
    <div className="flex items-center gap-3">
      <Image
        src={USER.img}
        className="size-12 rounded-full object-cover"
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

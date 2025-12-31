"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

export function UserInfo() {
  const [user, setUser] = useState({
    name: "Admin",
    avatar: "/images/user/user-01.png",
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name) {
          setUser({
            name: parsedUser.name,
            avatar: parsedUser.avatar || "/images/user/user-01.png",
          });
        }
      }
    } catch (error) {
      console.error("Error loading user from storage", error);
    }
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Image
        src={user.avatar}
        className="size-10 rounded-full object-cover"
        alt={`Avatar of ${user.name}`}
        role="presentation"
        width={40}
        height={40}
      />
      <span className="font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
        {user.name}
      </span>
    </div>
  );
}

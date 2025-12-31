"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "lucide-react";

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
    <Link
      href="/profile"
      className="flex items-center gap-3 group px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-2 transition-all duration-300"
    >
      <div className="relative">
        <div className="size-10 rounded-full bg-gray-100 dark:bg-dark-2 flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
          <User size={20} className="text-primary opacity-90" />
        </div>
        <div className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-dark"></div>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-sm font-bold text-dark dark:text-white max-[1024px]:sr-only leading-tight">
          {user.name}
        </span>
        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 max-[1024px]:sr-only uppercase tracking-wider">
          Owner
        </span>
      </div>
    </Link>
  );
}

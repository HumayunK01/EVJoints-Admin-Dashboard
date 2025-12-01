"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar, isMinimized, toggleMinimize } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  };

  useEffect(() => {
    // Keep collapsible open, when it's subpage is active
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }

            // Break the loop
            return true;
          }
        });
      });
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "max-w-[240px] shrink-0 border-r border-gray-200 bg-white transition-[width] duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-dark",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isOpen ? (isMinimized && !isMobile ? "w-[90px]" : "w-[240px]") : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className={cn("flex h-full flex-col py-6", isMinimized && !isMobile ? "items-center" : "pl-5 pr-3")}>
          <div
            className={cn(
              "relative flex items-center",
              isMinimized && !isMobile ? "justify-center group min-h-[44px] w-full" : "justify-between pr-4.5",
            )}
          >
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className={cn("block py-2.5 min-[850px]:py-0", isMinimized && !isMobile && "flex justify-center items-center w-full")}
            >
              {isMinimized && !isMobile ? (
                <Logo
                  src="/images/logo/logo-icon.svg"
                  className="size-11 transition-opacity duration-300 group-hover:opacity-0"
                />
              ) : (
                <Logo />
              )}
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}

            {!isMobile && (
              <button
                onClick={toggleMinimize}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-100 hover:text-dark dark:border-gray-800 dark:bg-gray-dark dark:text-gray-400 hover:dark:bg-gray-800 hover:dark:text-white",
                  isMinimized
                    ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 rotate-180 z-50 transition-opacity duration-300"
                    : "static size-8"
                )}
              >
                <ArrowLeftIcon className="size-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className={cn("custom-scrollbar mt-4 flex-1 overflow-y-auto min-[850px]:mt-6", isMinimized && !isMobile ? "w-full flex flex-col items-center" : "pr-3")}>
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(
                                ({ url }) => url === pathname,
                              )}
                              onClick={() => {
                                if (isMinimized && !isMobile) {
                                  toggleMinimize();
                                  setTimeout(() => toggleExpanded(item.title), 100);
                                } else {
                                  toggleExpanded(item.title);
                                }
                              }}
                              className={cn(
                                "group",
                                item.items.some(({ url }) => url === pathname)
                                  ? "bg-primary text-white hover:bg-primary/90 dark:bg-primary dark:text-white"
                                  : "text-gray-600 dark:text-gray-400",
                                isMinimized && !isMobile ? "justify-center px-4 gap-0" : "gap-3"
                              )}
                            >
                              <item.icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />

                              <span className={cn("overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap", isMinimized && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100")}>
                                {item.title}
                              </span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto transition-all duration-300 ease-in-out",
                                  expandedItems.includes(item.title) ? "rotate-0" : "rotate-180",
                                  isMinimized && !isMobile ? "w-0 opacity-0" : "w-4 opacity-100"
                                )}
                                aria-hidden="true"
                              />
                            </MenuItem>

                            {expandedItems.includes(item.title) && (!isMinimized || isMobile) && (
                              <ul
                                className="space-y-1.5 pb-3 pt-2"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={pathname === subItem.url}
                                      className="flex items-center gap-3 pl-9"
                                    >
                                      {"icon" in subItem && subItem.icon && (
                                        <subItem.icon
                                          className="size-5 shrink-0"
                                          aria-hidden="true"
                                        />
                                      )}
                                      <span>{subItem.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className={cn("flex items-center py-3", isMinimized && !isMobile ? "justify-center px-4 gap-0" : "gap-3")}
                                as="link"
                                href={href}
                                isActive={pathname === href}
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span className={cn("overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap", isMinimized && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100")}>
                                  {item.title}
                                </span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PaginationSelectProps {
    value: number;
    options: number[];
    onChange: (value: number) => void;
    direction?: "up" | "down";
}

export function PaginationSelect({ value, options, onChange, direction = "up" }: PaginationSelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
            <DropdownTrigger className="flex h-8 min-w-[4rem] items-center justify-between gap-1 rounded-lg border border-stroke px-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
                <span>{value}</span>
                {direction === "up" ? (
                    <ChevronUp className="h-4 w-4 opacity-50" />
                ) : (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                )}
            </DropdownTrigger>
            <DropdownContent
                className={cn(
                    "min-w-[4rem] border border-stroke bg-white p-1 shadow-1 dark:border-dark-3 dark:bg-gray-dark",
                    direction === "up" && "bottom-full mb-1 mt-0 origin-bottom-left"
                )}
                align={direction === "up" ? "start" : "center"}
            >
                <div className="flex flex-col gap-0.5">
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center justify-center rounded px-2 py-1.5 text-sm transition-colors",
                                "hover:bg-gray-100 dark:hover:bg-white/5",
                                value === option
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-dark dark:text-white"
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </DropdownContent>
        </Dropdown>
    );
}

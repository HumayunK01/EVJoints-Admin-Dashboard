"use client";

import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FilterOption {
    label: string;
    value: string;
}

interface FilterDropdownProps {
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
    className?: string;
    minWidth?: string;
}

export function FilterDropdown({ value, options, onChange, className, minWidth = "160px" }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    return (
        <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
            <DropdownTrigger className={cn(
                "flex items-center justify-between gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 transition-colors",
                className
            )}
                style={{ minWidth }}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")} />
            </DropdownTrigger>
            <DropdownContent
                className="min-w-full max-h-[300px] overflow-y-auto no-scrollbar border border-stroke bg-white p-1 shadow-2xl dark:border-dark-3 dark:bg-gray-dark"
                align="start"
            >
                <div className="flex flex-col gap-0.5">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex w-full items-center rounded px-2.5 py-2 text-left text-sm transition-colors",
                                "hover:bg-gray-100 dark:hover:bg-white/5",
                                value === option.value
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-dark dark:text-white font-medium"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </DropdownContent>
        </Dropdown>
    );
}

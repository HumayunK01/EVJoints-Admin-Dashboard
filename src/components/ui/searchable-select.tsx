"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    hideSearch?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className,
    label,
    hideSearch = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark') ||
                document.body.classList.contains('dark');
            setIsDarkMode(isDark);
        };
        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const filteredOptions = options.filter((opt) =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node);
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);

            if (isOutsideContainer && isOutsideDropdown) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                setCoords({
                    top: rect.bottom,
                    left: rect.left,
                    width: rect.width,
                });
            }
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        const updateCoords = () => {
            if (isOpen && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom,
                    left: rect.left,
                    width: rect.width,
                });
            }
        };
        if (isOpen) {
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearch("");
    };

    const dropdownContent = (
        <div
            ref={dropdownRef}
            className="fixed z-[99999] mt-1 rounded-lg border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2"
            style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {!hideSearch && (
                <div className="flex items-center border-b border-stroke p-2 dark:border-dark-3">
                    <Search className="mr-2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        className="w-full bg-transparent text-sm outline-none text-black dark:text-white"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    {search && (
                        <X
                            className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600"
                            onClick={() => setSearch("")}
                        />
                    )}
                </div>
            )}
            <ul className="max-h-60 overflow-y-auto py-1">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                        <li
                            key={option}
                            className={cn(
                                "flex cursor-pointer items-center justify-between px-4 py-2 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-dark-3",
                                option === value && "bg-primary/10 text-primary dark:bg-primary/20"
                            )}
                            onClick={() => handleSelect(option)}
                        >
                            <span>{option}</span>
                            {option === value && <Check className="h-4 w-4" />}
                        </li>
                    ))
                ) : (
                    <li className="px-4 py-2 text-sm text-gray-500">No results found</li>
                )}
            </ul>
        </div>
    );

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {label && (
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    {label}
                </label>
            )}
            <div
                className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm outline-none transition focus-within:border-primary dark:border-dark-3 dark:bg-dark-2",
                    isOpen && "border-primary",
                    "text-black dark:text-white"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={cn("truncate text-black dark:text-white font-medium", !value && "text-gray-400 dark:text-gray-500 font-normal")}>
                    {value || placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </div>

            {isOpen && mounted && createPortal(
                <div className={isDarkMode ? 'dark' : ''}>
                    {dropdownContent}
                </div>,
                document.body
            )}
        </div>
    );
};

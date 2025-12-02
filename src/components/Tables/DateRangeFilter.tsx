"use client";

import React, { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import { Instance } from "flatpickr/dist/types/instance";


interface DateRangeFilterProps {
    startDate: string;
    endDate: string;
    onApply: (start: string, end: string) => void;
    onCancel: () => void;
    onClear?: () => void;
    children?: React.ReactNode;
}

const PRESETS = [
    { label: "Today", getValue: () => [new Date(), new Date()] },
    { label: "Yesterday", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return [d, d]; } },
    { label: "Last 7 days", getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 6); return [start, end]; } },
    { label: "Last 28 days", getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 27); return [start, end]; } },
];

export function DateRangeFilter({ startDate, endDate, onApply, onCancel, onClear, children }: DateRangeFilterProps) {
    const calendarRef = useRef<HTMLDivElement>(null);
    const fpInstance = useRef<Instance | null>(null);
    const [selectedRange, setSelectedRange] = useState<[Date, Date] | null>(
        startDate && endDate ? [new Date(startDate), new Date(endDate)] : null
    );
    const [activePreset, setActivePreset] = useState<string | null>(null);

    useEffect(() => {
        if (calendarRef.current && !fpInstance.current) {
            fpInstance.current = flatpickr(calendarRef.current, {
                mode: "range",
                inline: true,
                showMonths: 1,
                defaultDate: selectedRange ? selectedRange : undefined,
                onChange: (selectedDates) => {
                    if (selectedDates.length === 2) {
                        setSelectedRange([selectedDates[0], selectedDates[1]]);
                        setActivePreset(null); // Clear preset if user manually selects
                    }
                },
            });
        }

        return () => {
            fpInstance.current?.destroy();
            fpInstance.current = null;
        };
    }, []);

    useEffect(() => {
        if (fpInstance.current && selectedRange) {
            fpInstance.current.setDate(selectedRange, false);
        }
    }, [selectedRange]);

    // Update local state when props change (e.g. when cleared externally)
    useEffect(() => {
        if (!startDate && !endDate) {
            setSelectedRange(null);
            setActivePreset(null);
            if (fpInstance.current) {
                fpInstance.current.clear();
            }
        }
    }, [startDate, endDate]);

    const handlePresetClick = (preset: typeof PRESETS[0]) => {
        const range = preset.getValue() as [Date, Date];
        setSelectedRange(range);
        setActivePreset(preset.label);
        if (fpInstance.current) {
            fpInstance.current.setDate(range, true);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const handleApply = () => {
        if (selectedRange) {
            // Format as YYYY-MM-DD for the parent component logic
            const format = (d: Date) => d.toISOString().split('T')[0];
            onApply(format(selectedRange[0]), format(selectedRange[1]));
        } else {
            onApply("", "");
        }
    };

    return (
        <div className="flex w-full max-w-[440px] flex-col rounded-lg bg-white shadow-lg dark:bg-gray-dark md:flex-row">
            {/* Sidebar */}
            <div className="w-full border-b border-stroke p-2 dark:border-dark-3 md:w-36 md:border-b-0 md:border-r">
                <div className="mb-2 px-3 py-2 text-sm font-medium text-dark dark:text-white">Custom</div>
                <ul className="space-y-1">
                    {PRESETS.map((preset) => (
                        <li key={preset.label}>
                            <button
                                onClick={() => handlePresetClick(preset)}
                                className={`w-full rounded px-3 py-2 text-left text-sm ${activePreset === preset.label
                                    ? "bg-primary/10 text-primary"
                                    : "text-dark hover:bg-gray-2 dark:text-white dark:hover:bg-dark-2"
                                    }`}
                            >
                                {preset.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col p-4">
                {children && <div className="mb-4">{children}</div>}

                <div className="mb-4 flex items-center gap-2">
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-gray-500">Start date</label>
                        <div className="rounded border border-stroke px-3 py-2 text-sm text-dark dark:border-dark-3 dark:text-white">
                            {selectedRange ? formatDate(selectedRange[0]) : "Select date"}
                        </div>
                    </div>
                    <div className="text-gray-400">-</div>
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-gray-500">End date</label>
                        <div className="rounded border border-stroke px-3 py-2 text-sm text-dark dark:border-dark-3 dark:text-white">
                            {selectedRange ? formatDate(selectedRange[1]) : "Select date"}
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <style>{`
                        .flatpickr-calendar {
                            width: 100% !important;
                        }
                        .flatpickr-rContainer {
                            width: 100% !important;
                        }
                        .flatpickr-days {
                            width: 100% !important;
                            border: none !important;
                        }
                        .dayContainer {
                            width: 100% !important;
                            min-width: 0 !important;
                            max-width: none !important;
                            justify-content: space-between !important;
                        }
                        .flatpickr-day {
                            height: 26px !important;
                            line-height: 26px !important;
                            max-width: none !important;
                            flex-basis: 14.28% !important;
                            font-size: 13px !important;
                        }
                        .flatpickr-current-month {
                            font-size: 90% !important;
                            padding-top: 5px !important;
                            width: 100% !important;
                            left: 0 !important;
                        }
                        .flatpickr-month {
                            height: 30px !important;
                            width: 100% !important;
                        }
                        .flatpickr-weekdaycontainer {
                            width: 100% !important;
                            display: flex !important;
                        }
                        .flatpickr-weekday {
                            flex: 1 !important;
                            font-size: 12px !important;
                        }
                    `}</style>
                    <div ref={calendarRef} className="[&_.flatpickr-calendar]:!shadow-none"></div>
                </div>

                <div className="mt-auto flex justify-between border-t border-stroke pt-4 dark:border-dark-3">
                    {onClear && (
                        <button
                            onClick={onClear}
                            className="rounded px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            Clear Filter
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            className="rounded px-4 py-2 text-sm font-medium text-dark hover:text-primary dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

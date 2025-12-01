"use client";

import React, { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import { Instance } from "flatpickr/dist/types/instance";

interface DateRangeFilterProps {
    startDate: string;
    endDate: string;
    onApply: (start: string, end: string) => void;
    onCancel: () => void;
}

const PRESETS = [
    { label: "Today", getValue: () => [new Date(), new Date()] },
    { label: "Yesterday", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return [d, d]; } },
    { label: "This week (Sun - Today)", getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - start.getDay()); return [start, end]; } },
    { label: "Last 7 days", getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 6); return [start, end]; } },
    { label: "Last week (Sun - Sat)", getValue: () => { const end = new Date(); end.setDate(end.getDate() - end.getDay() - 1); const start = new Date(end); start.setDate(start.getDate() - 6); return [start, end]; } },
    { label: "Last 28 days", getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 27); return [start, end]; } },
];

export function DateRangeFilter({ startDate, endDate, onApply, onCancel }: DateRangeFilterProps) {
    const calendarRef = useRef<HTMLDivElement>(null);
    const fpInstance = useRef<Instance | null>(null);
    const [selectedRange, setSelectedRange] = useState<[Date, Date] | null>(
        startDate && endDate ? [new Date(startDate), new Date(endDate)] : null
    );
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [isCompareEnabled, setIsCompareEnabled] = useState(false);

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
        <div className="flex w-full max-w-[600px] flex-col rounded-lg bg-white shadow-lg dark:bg-gray-dark md:flex-row">
            {/* Sidebar */}
            <div className="w-full border-b border-stroke p-2 dark:border-dark-3 md:w-48 md:border-b-0 md:border-r">
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
                <div className="mt-4 flex items-center justify-between px-3">
                    <span className="text-sm text-dark dark:text-white">Compare</span>
                    <button
                        onClick={() => setIsCompareEnabled(!isCompareEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isCompareEnabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                            }`}
                    >
                        <span
                            className={`${isCompareEnabled ? "translate-x-6" : "translate-x-1"
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
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

                <div ref={calendarRef} className="mb-4 flex justify-center [&_.flatpickr-calendar]:!shadow-none [&_.flatpickr-calendar]:!w-full"></div>

                <div className="flex justify-end gap-2 border-t border-stroke pt-4 dark:border-dark-3">
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
    );
}

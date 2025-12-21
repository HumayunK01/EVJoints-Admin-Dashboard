"use client";

import React, { useState } from "react";
import { LocationCoordinates } from "@/lib/api";
import { XIcon } from "@/assets/icons";

interface LocationViewerProps {
    isOpen: boolean;
    onClose: () => void;
    location: LocationCoordinates;
    title: string;
}

export default function LocationViewer({ isOpen, onClose, location, title }: LocationViewerProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyCoordinates = () => {
        const coords = `${location.latitude}, ${location.longitude}`;
        navigator.clipboard.writeText(coords);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyLatitude = () => {
        navigator.clipboard.writeText(location.latitude.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyLongitude = () => {
        navigator.clipboard.writeText(location.longitude.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-lg rounded-lg bg-white p-6 dark:bg-gray-dark">
                <div className="mb-4 flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
                    <h3 className="text-lg font-bold text-dark dark:text-white">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-dark hover:text-red-600 dark:text-white"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Address */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                            Address
                        </label>
                        <p className="rounded-lg border border-stroke bg-gray-50 px-4 py-3 text-sm text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white">
                            {location.address}
                        </p>
                    </div>

                    {/* Latitude */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                            Latitude
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={location.latitude}
                                readOnly
                                className="flex-1 rounded-lg border border-stroke bg-gray-50 px-4 py-2.5 text-sm text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                            />
                            <button
                                onClick={handleCopyLatitude}
                                className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Longitude */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                            Longitude
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={location.longitude}
                                readOnly
                                className="flex-1 rounded-lg border border-stroke bg-gray-50 px-4 py-2.5 text-sm text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                            />
                            <button
                                onClick={handleCopyLongitude}
                                className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Copy Both Button */}
                    <div className="pt-2">
                        <button
                            onClick={handleCopyCoordinates}
                            className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 transition-colors"
                        >
                            {copied ? "Coordinates Copied!" : "Copy Both Coordinates"}
                        </button>
                    </div>

                    {/* Google Maps Link */}
                    <div className="pt-2">
                        <a
                            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full rounded-lg border border-primary px-6 py-3 text-center font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                            Open in Google Maps
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React from "react";
import { XIcon } from "@/assets/icons";

interface FeedbackViewerProps {
    isOpen: boolean;
    onClose: () => void;
    feedback: string;
    userName: string;
}

export default function FeedbackViewer({ isOpen, onClose, feedback, userName }: FeedbackViewerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-dark">
                <div className="mb-4 flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
                    <h3 className="text-lg font-bold text-dark dark:text-white">
                        Trip Feedback - {userName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-dark hover:text-red-600 dark:text-white"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
                        <p className="text-sm leading-relaxed text-dark dark:text-white whitespace-pre-wrap">
                            {feedback}
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-stroke px-6 py-2.5 font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

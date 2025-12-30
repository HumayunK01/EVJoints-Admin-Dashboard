"use client";

import React, { useState, useEffect } from "react";
import { TripCheckin } from "@/lib/api";
import { XIcon, CheckIcon } from "@/assets/icons";

interface StoryActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: TripCheckin | null;
    onSave: (updated: TripCheckin) => void;
}

export default function StoryActionModal({ isOpen, onClose, trip, onSave }: StoryActionModalProps) {
    const [blogLink, setBlogLink] = useState("");

    useEffect(() => {
        if (trip) {
            setBlogLink(trip.blogLink || "");
        }
    }, [trip]);

    if (!isOpen || !trip) return null;

    const handleApprove = () => {
        const updated: TripCheckin = {
            ...trip,
            storyStatus: "Approved",
            blogLink: blogLink || null,
            approvalDate: new Date().toISOString(),
            approvedBy: "Admin",
        };
        onSave(updated);
        onClose();
    };

    const handleReject = () => {
        const updated: TripCheckin = {
            ...trip,
            storyStatus: "Rejected",
            blogLink: null,
            approvalDate: new Date().toISOString(),
            approvedBy: "Admin",
        };
        onSave(updated);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-lg rounded-lg bg-white p-6 dark:bg-gray-dark">
                <div className="mb-6 flex items-center justify-between border-b border-stroke pb-4 dark:border-dark-3">
                    <h3 className="text-lg font-bold text-dark dark:text-white">
                        Trip Story Action
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-dark hover:text-red-600 dark:text-white"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Trip Info */}
                    <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-2">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-dark dark:text-white">Trip ID:</span>
                                <span className="text-sm text-dark dark:text-white">{trip.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-dark dark:text-white">User:</span>
                                <span className="text-sm text-dark dark:text-white">{trip.firstName} {trip.lastName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-dark dark:text-white">Route:</span>
                                <span className="text-sm text-dark dark:text-white truncate max-w-[200px]">
                                    {trip.source.split(',')[0]} → {trip.destination.split(',')[0]}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-dark dark:text-white">Date:</span>
                                <span className="text-sm text-dark dark:text-white">
                                    {trip.dateTime ? new Date(trip.dateTime).toLocaleDateString() : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-dark dark:text-white">Current Status:</span>
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${trip.storyStatus === "Approved" ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                                    trip.storyStatus === "Rejected" ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                                        "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                                    }`}>
                                    {trip.storyStatus || "Pending"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Blog Link Input */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                            Blog Link (Optional)
                        </label>
                        <input
                            type="url"
                            value={blogLink}
                            onChange={(e) => setBlogLink(e.target.value)}
                            placeholder="https://blog.evjoints.com/trip-story"
                            className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Add a blog link if the story has been published
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                        <button
                            onClick={handleApprove}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 transition-colors"
                        >
                            <CheckIcon className="h-5 w-5" />
                            Approve Story
                        </button>
                        <button
                            onClick={handleReject}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700 transition-colors"
                        >
                            <XIcon className="h-5 w-5" />
                            Reject Story
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

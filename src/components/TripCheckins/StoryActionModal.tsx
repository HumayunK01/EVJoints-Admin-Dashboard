"use client";

import React, { useState, useEffect } from "react";
import { TripCheckin, getVendorDetails, updateTripStory } from "@/lib/api";
import { X, Check } from "lucide-react";

interface StoryActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: TripCheckin | null;
    onSave: (updated: TripCheckin) => void;
}

export default function StoryActionModal({ isOpen, onClose, trip, onSave }: StoryActionModalProps) {
    const [blogLink, setBlogLink] = useState("");
    const [currentUserName, setCurrentUserName] = useState("Admin");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (trip) {
            setBlogLink(trip.blogLink || "");
        }

        async function fetchUserName() {
            try {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const user = JSON.parse(storedUser);

                    // Try to get name from API first if ID exists
                    if (user.id) {
                        try {
                            const details = await getVendorDetails(user.id);
                            if (details.name) {
                                setCurrentUserName(details.name);
                                return;
                            }
                        } catch (err) {
                            console.error("Failed to fetch fresh user details", err);
                        }
                    }

                    // Fallback to stored name
                    if (user.name) {
                        setCurrentUserName(user.name);
                    }
                }
            } catch (e) {
                console.error("Failed to parse user from local storage");
            }
        }

        if (isOpen) {
            fetchUserName();
        }
    }, [trip, isOpen]);

    if (!isOpen || !trip) return null;

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await updateTripStory(trip.id, "Approved", currentUserName, blogLink);

            // Update local state to reflect change immediately
            const updated: TripCheckin = {
                ...trip,
                storyStatus: "Approved",
                blogLink: blogLink || null,
                approvalDate: new Date().toISOString(),
                approvedBy: `[APPROVED_BY:${currentUserName}]`,
            };
            onSave(updated);
            onClose();
        } catch (error) {
            console.error("Failed to approve story:", error);
            alert("Failed to approve story. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        try {
            await updateTripStory(trip.id, "Rejected", currentUserName);

            const updated: TripCheckin = {
                ...trip,
                storyStatus: "Rejected",
                approvalDate: new Date().toISOString(),
                approvedBy: `[REJECTED_BY:${currentUserName}]`,
            };
            onSave(updated);
            onClose();
        } catch (error) {
            console.error("Failed to reject story:", error);
            alert("Failed to reject story. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
                        <X className="h-6 w-6" />
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
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-sm font-medium text-dark dark:text-white shrink-0">Route:</span>
                                <span className="text-sm text-dark dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
                                    {trip.source.split(',')[0]} → {trip.destination.split(',')[0]}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-dark dark:text-white">Date:</span>
                                <span className="text-sm text-dark dark:text-white">
                                    {trip.dateTime ? new Date(trip.dateTime).toLocaleDateString() : "-"}
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
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                        <button
                            onClick={handleApprove}
                            disabled={isLoading}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-colors ${isLoading ? "bg-green-600/50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} w-full sm:w-auto`}
                        >
                            <Check className="h-5 w-5" />
                            {isLoading ? "Processing..." : "Approve Story"}
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={isLoading}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium text-white transition-colors ${isLoading ? "bg-red-600/50 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"} w-full sm:w-auto`}
                        >
                            <X className="h-5 w-5" />
                            {isLoading ? "Processing..." : "Reject Story"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

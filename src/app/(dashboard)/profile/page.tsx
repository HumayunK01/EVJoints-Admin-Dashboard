"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, ShieldCheck, FileText } from "lucide-react";
import { getVendorDetails, VendorDetails } from "@/lib/api";

export default function ProfilePage() {
    const [user, setUser] = useState<VendorDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            try {
                // Get user ID from localStorage
                const stored = localStorage.getItem("user");
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.id) {
                        const details = await getVendorDetails(data.id);
                        setUser(details);
                    }
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Failed to load profile details (No ID found).</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-screen-2xl p-0 md:p-2">
            <div className="overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
                <div className="relative z-20 h-20 md:h-28 bg-gradient-to-r from-primary to-primary/60">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <User size={120} />
                    </div>
                </div>

                <div className="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
                    <div className="relative z-30 mx-auto -mt-12 h-24 w-full max-w-24 rounded-full bg-white/20 p-1 backdrop-blur sm:h-32 sm:max-w-32 sm:p-2">
                        <div className="relative drop-shadow-2 flex items-center justify-center bg-white dark:bg-dark-2 rounded-full h-full w-full">
                            <User size={60} className="text-primary opacity-90" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="mb-1 text-2xl font-bold text-dark dark:text-white flex items-center justify-center gap-2">
                            <ShieldCheck size={24} className="text-primary" />
                            {user.name}
                        </h3>

                        <div className="mx-auto max-w-[700px] mt-10">
                            <h4 className="font-bold text-dark dark:text-white mb-4 text-left px-4 tracking-wider uppercase text-xs">
                                Account Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 text-left">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-dark shadow-sm">
                                        <Mail size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Email Address</p>
                                        <p className="text-sm font-medium text-dark dark:text-white">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-dark shadow-sm">
                                        <Phone size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone Number</p>
                                        <p className="text-sm font-medium text-dark dark:text-white">{user.mobile}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-dark shadow-sm">
                                        <FileText size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">PAN Number</p>
                                        <p className="text-sm font-medium text-dark dark:text-white">{user.pan || "—"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-dark shadow-sm">
                                        <ShieldCheck size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">GST Number</p>
                                        <p className="text-sm font-medium text-dark dark:text-white">{user.gst_no || "—"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

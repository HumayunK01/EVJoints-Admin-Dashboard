"use client";

import React, { useState, useEffect } from "react";
import { TripCheckin } from "@/lib/api";
import { XIcon } from "@/assets/icons";
import { createPortal } from "react-dom";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: TripCheckin;
    onSave: (updated: TripCheckin) => void;
}



export default function CheckinEditDrawer({ isOpen, onClose, data, onSave }: Props) {
    const [formData, setFormData] = useState<TripCheckin | null>(null);
    const [editReason, setEditReason] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Derived state for validation
    const computedAmount = (formData?.rate_per_unit || 0) * (formData?.units_charged || 0);
    const isAmountMismatch = formData?.amount && Math.abs(formData.amount - computedAmount) > 1;

    useEffect(() => {
        if (data) {
            setFormData({ ...data });
        }
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        // Validation logic
        if (isAmountMismatch && editReason.length < 10) {
            alert("Override reason is required (min 10 chars) due to amount mismatch.");
            return;
        }

        onSave(formData);
        onClose();
    };

    if (!isOpen || !formData || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-boxdark h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
                <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
                    <h3 className="text-lg font-bold text-black dark:text-white">Edit Check-in #{formData.id}</h3>
                    <button onClick={onClose}>
                        <XIcon className="w-6 h-6 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Rating */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Rating</label>
                            <input
                                type="number"
                                min="0" max="5"
                                value={formData.rating || ""}
                                onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                                className="w-full rounded border border-stroke px-3 py-2 outline-none dark:bg-form-input dark:border-strokedark"
                            />
                        </div>

                        {/* Charging Details */}
                        <div className="border-t pt-4 border-stroke dark:border-strokedark">
                            <h4 className="font-semibold mb-3">Charging</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Units (kWh)</label>
                                    <input
                                        type="number"
                                        value={formData.units_charged || ""}
                                        onChange={e => setFormData({ ...formData, units_charged: parseFloat(e.target.value) })}
                                        className="w-full rounded border border-stroke px-3 py-2 outline-none dark:bg-form-input dark:border-strokedark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rate (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.rate_per_unit || ""}
                                        onChange={e => setFormData({ ...formData, rate_per_unit: parseFloat(e.target.value) })}
                                        className="w-full rounded border border-stroke px-3 py-2 outline-none dark:bg-form-input dark:border-strokedark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.amount || ""}
                                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                        className={`w-full rounded border px-3 py-2 outline-none dark:bg-form-input ${isAmountMismatch ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                    />
                                    {isAmountMismatch && (
                                        <p className="text-red-500 text-xs mt-1">Mismatch: Expected ₹{computedAmount}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Admin Override Reasons */}
                        <div className="border-t pt-4 border-stroke dark:border-strokedark">
                            <label className="block text-sm font-medium mb-1">Edit Reason (for Audit)</label>
                            <textarea
                                rows={3}
                                value={editReason}
                                onChange={e => setEditReason(e.target.value)}
                                className="w-full rounded border border-stroke px-3 py-2 outline-none dark:bg-form-input dark:border-strokedark"
                                placeholder="Why are you editing this?"
                            ></textarea>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">Cancel</button>
                    <button type="submit" form="edit-form" className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 text-sm">Save Changes</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

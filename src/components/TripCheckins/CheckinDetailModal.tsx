"use client";

import React from "react";
import Modal from "@/components/ui/modal";
import { TripCheckin } from "@/lib/api";
import { CheckIcon, XIcon, PencilSquareIcon } from "@/assets/icons";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: TripCheckin;
    onEdit: () => void;
}

export default function CheckinDetailModal({ isOpen, onClose, data, onEdit }: Props) {
    if (!data) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Trip Check-in #${data.id}`}
            className="max-w-4xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: User Card */}
                <div className="col-span-1 border rounded-lg p-4 bg-gray-50 dark:bg-meta-4/30 h-fit">
                    <h4 className="font-semibold mb-2">User Details</h4>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Name:</span> {data.firstName} {data.lastName}</p>
                        <p><span className="text-gray-500">Phone:</span> {data.user_phone || "N/A"}</p>
                        <p><span className="text-gray-500">EV:</span> {data.ev ? `${data.ev.brand} ${data.ev.model}` : "N/A"}</p>
                    </div>
                </div>

                {/* Middle: Trip Details */}
                <div className="col-span-2 space-y-4">
                    <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-3">Trip info</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Source</p>
                                <p>{data.source}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Destination</p>
                                <p>{data.destination}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Date</p>
                                <p>{new Date(data.dateTime).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Status</p>
                                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium border">
                                    {data.tripStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-3">Check-in Data</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Navigation</p>
                                <p>{data.navigation}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Check-in</p>
                                <p>{data.checkIn}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Rating</p>
                                <p>{data.rating ? `${data.rating} / 5` : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Feedback</p>
                                <p>{data.feedback_provided ? "Yes" : "No"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4">
                        <h4 className="font-bold mb-3">Charging</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs">Units</p>
                                <p>{data.units_charged || 0} kWh</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Rate</p>
                                <p>₹{data.rate_per_unit || 0}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs">Amount</p>
                                <p>₹{data.amount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stroke dark:border-strokedark">
                <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">
                    Close
                </button>
                <button onClick={onEdit} className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90 flex items-center gap-2 text-sm">
                    <PencilSquareIcon className="w-4 h-4" /> Edit
                </button>
                {/* Placeholders for Approve/Reject depending on logic, keeping it simple for now */}
            </div>
        </Modal>
    );
}

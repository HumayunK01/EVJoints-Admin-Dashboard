import React, { useState, useEffect } from "react";
import { StationSubmission, Connector } from "@/lib/api";
import { X, CheckCircle } from "lucide-react";
import { NETWORK_NAMES } from "@/data/networks";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

interface ModalFieldConfig {
    label: string;
    key: keyof StationSubmission;
    type: "text" | "number" | "select" | "tel";
    required?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    options?: string[]; // For select
    section: "Station Information" | "Location & Contact";
}

const STATION_FIELDS: ModalFieldConfig[] = [
    { label: "Station Name", key: "stationName", type: "text", required: true, placeholder: "Enter station name", section: "Station Information" },
    { label: "Stations ID", key: "stationNumber", type: "text", readOnly: true, section: "Station Information" },
    {
        label: "Network Name",
        key: "networkName",
        type: "select",
        required: true,
        options: NETWORK_NAMES,
        section: "Station Information"
    },
    { label: "Station Type", key: "stationType", type: "text", placeholder: "e.g., Mall, Highway, Residential", section: "Station Information" },
    { label: "Added By", key: "addedByType", type: "select", options: ["EV Owner", "Station Owner", "CPO"], section: "Station Information" },
    { label: "Usage Type", key: "usageType", type: "select", required: true, options: ["Public", "Private"], section: "Station Information" },
    { label: "Operational Hours", key: "operationalHours", type: "text", placeholder: "e.g., 24/7 or 9 AM - 6 PM", section: "Station Information" },
    { label: "Latitude", key: "latitude", type: "number", required: true, placeholder: "e.g., 28.556", section: "Location & Contact" },
    { label: "Longitude", key: "longitude", type: "number", required: true, placeholder: "e.g., 77.09", section: "Location & Contact" },
    { label: "Contact Number", key: "contactNumber", type: "tel", required: true, placeholder: "+91XXXXXXXXXX", section: "Location & Contact" },
];

interface ConnectorFieldConfig {
    label: string;
    key: keyof Connector;
    type: "text" | "number" | "select";
    width?: "full" | "half";
    options?: string[];
}

const CONNECTOR_FIELDS: ConnectorFieldConfig[] = [
    { label: "Name", key: "name", type: "text", width: "full" },
    { label: "Count", key: "count", type: "number", width: "half" },
    { label: "Type", key: "type", type: "select", options: ["AC", "DC"], width: "half" },
    { label: "Power", key: "powerRating", type: "text", width: "half" },
    { label: "Tariff", key: "tariff", type: "text", width: "half" },
];

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    station: StationSubmission | null;
    onSave: (updated: StationSubmission, action?: 'SAVE' | 'APPROVE' | 'REJECT') => void;
    isSaved: boolean;
}

export default function ActionModal({ isOpen, onClose, station, onSave, isSaved }: ActionModalProps) {
    // Single state object for all station fields
    const [formData, setFormData] = useState<Partial<StationSubmission>>({});
    const [connectors, setConnectors] = useState<Connector[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    useEffect(() => {
        if (station) {
            setFormData({
                ...station,
                latitude: station.latitude, // Keep as numbers in state, input handles conversion
                longitude: station.longitude
            });
            setConnectors(JSON.parse(JSON.stringify(station.connectors))); // Deep copy
        }
    }, [station]);

    if (!isOpen || !station) return null;

    const handleConnectorChange = (index: number, field: keyof Connector, value: string) => {
        const updated = [...connectors];
        if (field === 'count') {
            updated[index] = { ...updated[index], [field]: parseInt(value) || 0 };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setConnectors(updated);
    };

    const handleAddConnector = () => {
        setConnectors([...connectors, {
            name: "New Connector",
            count: 1,
            type: "AC",
            powerRating: "",
            tariff: ""
        }]);
    };

    const handleDeleteConnector = (index: number) => {
        const updated = connectors.filter((_, idx) => idx !== index);
        setConnectors(updated);
    };

    const handleInputChange = (key: keyof StationSubmission, value: string) => {
        setFormData(prev => ({
            ...prev,
            [key]: key === 'latitude' || key === 'longitude' ? parseFloat(value) : value
        }));
    };



    const handleSave = (newStatus?: 'Approved' | 'Rejected', reason?: string) => {
        if (!station || !formData) return;

        const updated: StationSubmission = {
            ...station, // Keep ID, dates, etc.
            ...formData as StationSubmission, // Overwrite with edited fields
            connectors,
        };

        let action: 'SAVE' | 'APPROVE' | 'REJECT' = 'SAVE';
        if (newStatus === 'Approved') action = 'APPROVE';
        if (newStatus === 'Rejected') action = 'REJECT';

        if (newStatus) {
            updated.status = newStatus;
            if (newStatus === 'Approved') {
                updated.approvalDate = new Date().toISOString();
                updated.statusReason = undefined;
            } else if (newStatus === 'Rejected') {
                updated.statusReason = reason;
                updated.approvalDate = undefined;
            }
        }

        onSave(updated, action);

        if (newStatus) {
            onClose();
        } else {
            // Only show success notification for save action (not approve/reject which close modal)
            setShowSuccess(true);
        }
    };

    const handleReject = () => {
        const reason = window.prompt("Please enter a reason for rejection:");
        if (reason !== null) {
            handleSave('Rejected', reason);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white px-6 dark:bg-gray-dark">
                <div className="mb-6 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-gray-dark -mx-6 px-6 pt-6 pb-4 border-b border-stroke dark:border-dark-3">
                    <div>
                        <h3 className="text-xl font-bold text-dark dark:text-white">
                            Edit Station Details
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Submitted on {new Date(station.submissionDate).toLocaleDateString()} at {new Date(station.submissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-dark hover:text-red-600 dark:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-6 pb-6">
                    {/* Dynamic Station Fields */}
                    {["Station Information", "Location & Contact"].map((section) => (
                        <div key={section}>
                            <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white uppercase tracking-wide">
                                {section}
                            </h4>
                            <div className={`grid grid-cols-1 ${section === "Location & Contact" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
                                {STATION_FIELDS.filter(f => f.section === section).map((field) => (
                                    <div key={field.key}>
                                        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.type === "select" ? (
                                            <SearchableSelect
                                                options={field.options || []}
                                                value={(formData[field.key] as string) || ""}
                                                onChange={(val) => handleInputChange(field.key, val)}
                                                placeholder={`Select ${field.label}...`}
                                                hideSearch={field.options && field.options.length <= 5}
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                step={field.type === "number" ? "any" : undefined}
                                                value={formData[field.key] !== undefined && formData[field.key] !== null ? String(formData[field.key]) : ""}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                placeholder={field.placeholder}
                                                readOnly={field.readOnly}
                                                className={cn(
                                                    "w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white",
                                                    field.readOnly && "cursor-not-allowed bg-gray-100 dark:bg-dark-2 text-gray-500"
                                                )}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Connector Configuration Section */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white uppercase tracking-wide">
                            Connector Configuration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {connectors.map((connector, idx) => (
                                <div key={idx} className="rounded-lg border border-stroke p-4 dark:border-dark-3 bg-gray-50 dark:bg-dark-2 relative group">
                                    <div className="flex justify-between items-center mb-3 border-b border-stroke dark:border-dark-3 pb-2">
                                        <h5 className="text-sm font-bold text-dark dark:text-white">
                                            Connector #{idx + 1}
                                        </h5>
                                        <button
                                            onClick={() => handleDeleteConnector(idx)}
                                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                                            title="Delete Connector"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {/* Dynamic Connector Fields */}
                                        <div className="flex flex-wrap -mx-1">
                                            {CONNECTOR_FIELDS.map((field) => (
                                                <div key={field.key} className={`${field.width === 'half' ? 'w-1/2' : 'w-full'} px-1 mb-2`}>
                                                    <label className="mb-1 block text-xs font-medium text-dark dark:text-white">
                                                        {field.label}
                                                    </label>
                                                    {field.type === 'select' ? (
                                                        <select
                                                            value={(connector[field.key] as string) || ""}
                                                            onChange={(e) => handleConnectorChange(idx, field.key, e.target.value)}
                                                            className="w-full rounded border-[1.5px] border-stroke bg-white px-2 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                                        >
                                                            <option value="">Select</option>
                                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type={field.type}
                                                            min={field.type === 'number' ? "1" : undefined}
                                                            value={connector[field.key] || ""}
                                                            onChange={(e) => handleConnectorChange(idx, field.key, e.target.value)}
                                                            className="w-full rounded border-[1.5px] border-stroke bg-white px-2 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Connector Card */}
                            <button
                                onClick={handleAddConnector}
                                className="flex min-h-[250px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 hover:bg-primary/10 transition-colors"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                                <span className="font-medium text-primary">Add New Connector</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                        {station.status === 'Pending' && (
                            <button
                                onClick={handleReject}
                                className="flex-1 rounded-lg bg-red-500 px-6 py-3 font-medium text-white hover:bg-red-600 transition-colors"
                            >
                                Reject
                            </button>
                        )}
                        <button
                            onClick={() => handleSave()}
                            className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 transition-colors"
                        >
                            Save Changes
                        </button>
                        {station.status === 'Pending' && (
                            <button
                                onClick={() => handleSave('Approved')}
                                disabled={!isSaved}
                                className={cn(
                                    "flex-1 rounded-lg px-6 py-3 font-medium text-white transition-all",
                                    isSaved
                                        ? "bg-green-500 hover:bg-green-600"
                                        : "bg-gray-400 cursor-not-allowed opacity-70"
                                )}
                                title={!isSaved ? "Please 'Save Changes' first before approving" : "Approve Station"}
                            >
                                Approve
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Notification */}
            {showSuccess && (
                <div className="absolute top-6 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Saved Successfully</span>
                    </div>
                </div>
            )}
        </div>
    );
}

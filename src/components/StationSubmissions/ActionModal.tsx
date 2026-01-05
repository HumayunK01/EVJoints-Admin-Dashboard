"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Save, AlertCircle, CheckCircle, Plus, Trash2, Maximize2, Image as ImageIcon, ImageOff, Upload, AlertTriangle, Download } from "lucide-react";
import { StationSubmission, Connector, Network, ChargerType, massUploadStations } from "@/lib/api";
import { NETWORK_NAMES } from "@/data/networks";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn, formatDateTime, resolveImageUrl } from "@/lib/utils";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/ui/LocationPicker"), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-dark-2 animate-pulse rounded-lg mb-4" />
});




// Internal component to handle authenticated image fetching
function AuthenticatedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        const loadImage = async () => {
            if (!src) return;

            // If it's not our API or doesn't need auth, just set it
            if (!src.includes('devapi.evjoints.com') && !src.includes('api/attachment')) {
                setImageSrc(src);
                return;
            }

            try {
                let token = "";
                if (typeof document !== "undefined") {
                    const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
                    if (match) token = match[2];
                }

                const headers: HeadersInit = {};
                if (token) {
                    headers["Authorization"] = "Bearer " + token;
                }

                const res = await fetch(src, { headers });
                if (!res.ok) throw new Error('Failed to load');

                const blob = await res.blob();
                if (active) setImageSrc(URL.createObjectURL(blob));
            } catch (err) {
                if (active) setError(true);
            }
        };
        loadImage();
        return () => { active = false; };
    }, [src]);

    if (error) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-gray-100 dark:bg-dark-2 pointer-events-none">
                <ImageOff className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-[10px] text-gray-500">Failed</span>
            </div>
        );
    }

    if (!imageSrc) {
        return <div className="h-full w-full bg-gray-100 dark:bg-dark-2 animate-pulse rounded-lg" />;
    }

    return (
        <React.Fragment>
            <a
                href={imageSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full w-full"
            >
                <img
                    src={imageSrc}
                    alt={alt}
                    className={className}
                    onError={() => setError(true)}
                />
            </a>
        </React.Fragment>
    );
}

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

interface ConnectorFieldConfig {
    label: string;
    key: keyof Connector;
    type: "text" | "number" | "select";
    width?: "full" | "half";
    options?: string[];
}

const CONNECTOR_FIELDS: ConnectorFieldConfig[] = [
    { label: "Name", key: "name", type: "select", width: "full" }, // Changed to select
    { label: "Count", key: "count", type: "number", width: "half" },
    { label: "Type", key: "type", type: "text", width: "half" }, // Changed to text (readonly/derived) or select
    { label: "Power", key: "powerRating", type: "number", width: "half" },
    { label: "Tariff", key: "tariff", type: "number", width: "half" },
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
    const [networkOptions, setNetworkOptions] = useState<string[]>([]);
    const [inactiveNetworks, setInactiveNetworks] = useState<Network[]>([]);
    const [allNetworks, setAllNetworks] = useState<Network[]>([]);
    const [chargerTypes, setChargerTypes] = useState<ChargerType[]>([]);
    const [networkToDelete, setNetworkToDelete] = useState<{ id: number; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const result = await massUploadStations(file);
            let message = result.message;
            if (result.summary) {
                message += "\nSuccess: " + result.summary.successful + "\nFailed: " + result.summary.failed;
            }
            if (result.failedRows && result.failedRows.length > 0) {
                message += "\n\nCheck console for details on failed rows.";
                console.warn("[Mass Upload] Failed Rows:", result.failedRows);
            }
            alert(message);

            // Close modal after successful upload to refresh table
            if (result.summary && result.summary.successful > 0) {
                onClose();
                // We should ideally trigger refresh here, but onClose will just close modal. 
                // The parent component handles table state. We might need a callback to force refresh.
                // For now, user can manually refresh or we rely on parent to detect closure?
                // Actually onSave usually triggers refresh.
                // We can call onSave with a dummy object to force refresh?
                // Or just assume user refreshes. 
                // Let's call onSave to trigger refresh if we can, but onSave expects a station.
                // We'll just alert and close for now.
            }

        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error.message} `);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const fetchNetworks = useCallback(async () => {
        try {
            const { getNetworks, getChargerTypes } = await import("@/lib/api");

            // Fetch networks
            const res = await getNetworks();
            const activeNetworks = res.active.map(n => n.name).sort();
            const options = Array.from(new Set([...activeNetworks, "Others"]));
            setNetworkOptions(options);
            setInactiveNetworks(res.inactive);
            setAllNetworks([...res.active, ...res.inactive]);

            // Fetch charger types
            const types = await getChargerTypes();
            setChargerTypes(types);

        } catch (error) {
            console.error("Failed to fetch data:", error);
            // Fallback
            setNetworkOptions(NETWORK_NAMES);
        }
    }, []);

    const handleLocationSelect = useCallback((lat: number, lng: number, address?: string) => {
        setFormData(prev => {
            const updates: Partial<StationSubmission> = {
                ...prev,
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lng.toFixed(6))
            };

            // Only update address if a valid string is returned
            if (address) {
                updates.address = address;
            }

            return updates;
        });
        if (error) setError(null);
    }, [error]);

    useEffect(() => {
        fetchNetworks();
    }, [fetchNetworks]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    useEffect(() => {
        if (station && isOpen) {
            // Attempt to resolve network ID/Status because API response often lacks them
            let resolvedId = station.networkId;
            let resolvedStatus = (station as any).networkStatus ?? 0;

            if (!resolvedId && station.networkName && allNetworks.length > 0) {
                const targetName = station.networkName.trim().toLowerCase();
                const found = allNetworks.find(n => n.name.trim().toLowerCase() === targetName);
                if (found) {
                    resolvedId = found.id;
                    resolvedStatus = found.status;
                    console.log(`[Frontend] Resolved Network "${station.networkName}" -> ID: ${resolvedId}, Status: ${resolvedStatus} `);
                } else {
                    console.warn(`[Frontend] Could not find network "${station.networkName}" in list of ${allNetworks.length} networks`);
                }
            }

            setFormData({
                ...station,
                latitude: station.latitude,
                longitude: station.longitude,
                networkId: resolvedId,
                networkStatus: resolvedStatus
            });
            setConnectors(station.connectors.map(c => ({
                ...c,
                tariff: c.tariff ? String(c.tariff).replace(/[^\d.]/g, "") : "",
                powerRating: c.powerRating ? String(c.powerRating).replace(/[^\d.]/g, "") : ""
            })));
        }
    }, [station, allNetworks, isOpen]);

    const handleConnectorChange = (index: number, field: keyof Connector, value: string) => {
        const updated = [...connectors];

        if (field === 'name') {
            // When Name changes, find the charger type and auto-fill other fields
            const selectedType = chargerTypes.find(ct => ct.name === value);
            if (selectedType) {
                updated[index] = {
                    ...updated[index],
                    name: selectedType.name,
                    chargerTypeId: selectedType.id,
                    type: selectedType.type,
                    powerRating: selectedType.defaultPower || updated[index].powerRating || ""
                };
            } else {
                updated[index] = { ...updated[index], name: value };
            }
        } else if (field === 'count') {
            updated[index] = { ...updated[index], [field]: parseInt(value) || 0 };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setConnectors(updated);
    };

    const handleAddConnector = () => {
        if (chargerTypes.length === 0) {
            alert("Unable to add connector: No charger types available. Please try again later.");
            return;
        }

        const defaultType = chargerTypes[0];

        setConnectors([...connectors, {
            name: defaultType.name,
            chargerTypeId: defaultType.id,
            count: 1,
            type: defaultType.type,
            powerRating: defaultType.defaultPower || "",
            tariff: ""
        }]);
    };

    const handleDeleteConnector = (index: number) => {
        const updated = connectors.filter((_, idx) => idx !== index);
        setConnectors(updated);
    };

    // Clear error when form changes
    const handleInputChange = (key: keyof StationSubmission, value: string) => {
        if (error) setError(null);
        setFormData(prev => {
            const updates: Partial<StationSubmission> = { [key]: key === 'latitude' || key === 'longitude' ? parseFloat(value) : value };

            if (key === 'networkName') {
                if (value === "Others") {
                    // If switching to "Others" category, clear the specific ID to avoiding accidental renaming of previous active network
                    updates.networkId = undefined;
                    updates.networkStatus = 0;
                } else {
                    const found = allNetworks.find(n => n.name === value);
                    if (found) {
                        // If name matches a known network, link to its ID and Status
                        updates.networkId = found.id;
                        updates.networkStatus = found.status;
                    } else {
                        // New/Renamed Custom Network -> Always Inactive (0)
                        updates.networkStatus = 0;
                    }
                }
            }

            return {
                ...prev,
                ...updates
            };
        });
    };

    const handleDeleteNetwork = async (name: string) => {
        if (!name) return;

        // Find the network object to get ID
        const network = inactiveNetworks.find(n => n.name === name);
        if (!network) {
            // If not found in inactive list, maybe it's just typed text not saved in DB?
            // In that case, just clearing it or doing nothing is fine. 
            // Only strictly allow deleting from DB if we have an ID.
            return;
        }

        setNetworkToDelete({ id: network.id, name: network.name });
    };

    const confirmDeleteNetwork = async () => {
        if (!networkToDelete) return;

        try {
            const { deleteNetwork } = await import("@/lib/api");
            await deleteNetwork(networkToDelete.id);
            // Refresh networks list
            await fetchNetworks();
            // Clear the field if it was the selected one
            if (formData.networkName === networkToDelete.name) {
                handleInputChange("networkName", "");
            }
            setNetworkToDelete(null);
        } catch (error) {
            console.error("Failed to delete network:", error);
            alert("Failed to delete network. Please try again.");
        }
    };

    const stationFields = React.useMemo(() => {
        const isOthersSelected =
            formData.networkName === "Others" ||
            (!!formData.networkName &&
                !networkOptions.includes(formData.networkName) &&
                inactiveNetworks.some((n) => n.name === formData.networkName));

        // If the actual network name is an inactive one, we want the first dropdown to show "Others"
        // But SearchableSelect takes value from formData[key].
        // We might need a virtual field for the first dropdown if we want this behavior.
        // For simplicity, let's assume the user selects "Others" in the first dropdown.
        // Then we show the second dropdown.
        // When second dropdown is changed, we update formData.networkName to the specific inactive one?
        // IF we do that, the first dropdown value (taking from networkName) will change to the inactive one, which is NOT in its options "Others".
        // This causes UI inconsistency.

        // SOLUTION: Use a separate temporary state for the "Primary Network Selection" if needed, 
        // OR rely on the fact that if value is not in options, SearchableSelect might show it as custom text or we handle it.

        // Let's refine based on user request: "add one more field... if selected other".

        const fields: ModalFieldConfig[] = [
            { label: "Station Name", key: "stationName", type: "text", required: true, placeholder: "Enter station name", section: "Station Information" },
            { label: "Stations ID", key: "stationNumber", type: "text", required: true, readOnly: true, section: "Station Information" },
            {
                label: "Network Name",
                key: "networkName",
                type: "select",
                required: true,
                options: networkOptions,
                section: "Station Information"
            },
        ];

        // Conditional Field for "Others"
        // We check if the current networkName is "Others" (explicitly selected) 
        // OR if it is not in the standard network options (meaning it's a custom/inactive one)
        // networkOptions includes active networks + "Others".
        const isCustomOrInactive = formData.networkName && !networkOptions.includes(formData.networkName);
        const showOtherField = formData.networkName === "Others" || isCustomOrInactive;

        if (showOtherField) {
            fields.push({
                label: "Other Network Name",
                key: "networkName", // This field will bind to the same networkName key
                type: "text", // Changed to text to allow editing/correction
                placeholder: "Enter or correct network name",
                section: "Station Information"
            } as any);
        }

        fields.push(
            { label: "Station Type", key: "stationType", type: "text", placeholder: "e.g., Mall, Highway, Residential", section: "Station Information" },
            { label: "Added By", key: "addedByType", type: "select", required: true, options: ["EV Owner", "Station Owner", "CPO"], section: "Station Information" },
            { label: "Usage Type", key: "usageType", type: "select", required: true, options: ["Public", "Private"], section: "Station Information" },
            { label: "Operational Hours", key: "operationalHours", type: "text", placeholder: "e.g., 24/7 or 9 AM - 6 PM", section: "Station Information" },

            { label: "Address", key: "address", type: "text", required: true, placeholder: "Enter station address", section: "Location & Contact" },
            { label: "Latitude", key: "latitude", type: "number", required: true, readOnly: true, placeholder: "Select on map", section: "Location & Contact" },
            { label: "Longitude", key: "longitude", type: "number", required: true, readOnly: true, placeholder: "Select on map", section: "Location & Contact" },
            { label: "Contact Number", key: "contactNumber", type: "tel", required: true, placeholder: "+91XXXXXXXXXX", section: "Location & Contact" }
        );

        return fields;
    }, [networkOptions, inactiveNetworks, formData.networkName]);


    const validateForm = () => {
        const requiredFields = [
            'stationName',
            'networkName',
            'addedByType',
            'usageType',
            'latitude',
            'longitude',
            'contactNumber'
        ];

        for (const field of requiredFields) {
            const val = formData[field as keyof StationSubmission];
            if (val === undefined || val === null || val === '') {
                const readableField = field.replace(/([A-Z])/g, ' $1').trim();
                return `Please fill in the required field: ${readableField.charAt(0).toUpperCase() + readableField.slice(1)} `;
            }
        }
        return null;
    };

    const handleSave = (newStatus?: 'Approved' | 'Rejected', reason?: string) => {
        if (!station || !formData) return;

        // Perform validation before saving
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            // Scroll to top to make error visible
            if (modalContentRef.current) {
                modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
            // Auto hide error after 3 seconds
            setTimeout(() => setError(null), 3000);
            return;
        }

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

    if (!isOpen || !station) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
            <div
                ref={modalContentRef}
                className="relative w-full max-w-3xl h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-xl bg-white px-6 dark:bg-gray-dark shadow-2xl animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
            >
                <div className="mb-6 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-gray-dark -mx-6 px-6 pt-6 pb-4 border-b border-stroke dark:border-dark-3">
                    <div>
                        <h3 className="text-xl font-bold text-dark dark:text-white">
                            {station.id === 0 ? "Add Station Details" : "Edit Station Details"}
                        </h3>
                        {station.id !== 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Submitted on {formatDateTime(station.submissionDate)}
                            </p>
                        )}
                        {/* Download Template Button (Only for New Station) */}
                        {station.id === 0 && (
                            <div className="mt-1">
                                <button
                                    onClick={() => {
                                        const headers = [
                                            "Station Name", "Station Type", "Usage Type", "Latitude", "Longitude",
                                            "Address", "Contact Number", "Open Time", "Close Time", "Network ID", "Connectors"
                                        ];
                                        const sample = [
                                            "Sample Station", "Mall", "PUBLIC", "19.0760", "72.8777",
                                            "123 Street Name, City", "98765543210", "09:00:00", "21:00:00", "1",
                                            '[{"chargerTypeId":1,"count":2,"powerRating":"22","tariff":"15"}]'
                                        ];

                                        const csvContent = [
                                            headers.join(","),
                                            sample.map(field => {
                                                const str = String(field);
                                                if (str.includes(",") || str.includes('"')) {
                                                    return '"' + str.replace(/"/g, '""') + '"';
                                                }
                                                return str;
                                            }).join(",")
                                        ].join("\n");

                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const link = document.createElement("a");
                                        const url = URL.createObjectURL(blob);
                                        link.setAttribute("href", url);
                                        link.setAttribute("download", "station_template.csv");
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Template (Excel/CSV)
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-dark hover:text-red-600 dark:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 -mx-6 px-6">
                        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6 pb-6">
                    {/* Dynamic Station Fields */}
                    {["Station Information", "Location & Contact"].map((section, idx) => (
                        <div key={section} className={idx > 0 ? "mt-6" : ""}>
                            <h4 className="mb-4 text-sm font-semibold text-dark dark:text-white uppercase tracking-wide">
                                {section}
                            </h4>
                            {section === "Location & Contact" && (
                                <LocationPicker
                                    latitude={Number(formData.latitude) || 0}
                                    longitude={Number(formData.longitude) || 0}
                                    onLocationSelect={handleLocationSelect}
                                />
                            )}
                            <div className={`grid grid-cols-1 ${section === "Location & Contact" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4`}>
                                {stationFields.filter(f => f.section === section).map((field, idx) => {
                                    // Custom Logic for Network Dropdowns
                                    let value = (formData[field.key] as string) || "";
                                    let onChange = (val: string) => handleInputChange(field.key, val);

                                    if (field.label === "Network Name") {
                                        // If the actual network is an inactive one (or "Others"), show "Others" in this dropdown
                                        const isOther = formData.networkName === "Others" || (formData.networkName && !networkOptions.includes(formData.networkName));
                                        if (isOther) {
                                            value = "Others";
                                        }
                                    } else if (field.label === "Other Network Name") {
                                        // If actual value is literally "Others", show blank so user can type.
                                        // Otherwise show the custom value.
                                        if (formData.networkName === "Others") {
                                            value = "";
                                        } else {
                                            value = formData.networkName || "";
                                        }
                                    }

                                    return (
                                        <div key={`${field.key} -${idx} `}>
                                            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </label>
                                            {field.type === "select" ? (
                                                <SearchableSelect
                                                    options={field.options || []}
                                                    value={value}
                                                    onChange={onChange}
                                                    placeholder={`Select ${field.label}...`}
                                                    hideSearch={field.options && field.options.length <= 5}
                                                />
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type={field.type}
                                                        step={field.type === "number" ? "any" : undefined}
                                                        value={formData[field.key] !== undefined && formData[field.key] !== null ? String(formData[field.key]) : ""}
                                                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                        placeholder={field.placeholder}
                                                        readOnly={field.readOnly}
                                                        className={cn(
                                                            "w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white",
                                                            field.readOnly && "cursor-not-allowed bg-gray-100 dark:bg-dark-2 text-gray-500",
                                                            field.label === "Other Network Name" && "pr-10"
                                                        )}
                                                    />
                                                    {field.label === "Other Network Name" &&
                                                        formData.networkName && (
                                                            <button
                                                                onClick={() => handleDeleteNetwork(formData.networkName!)}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1"
                                                                title="Delete from database"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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
                                            {CONNECTOR_FIELDS.map((field) => {
                                                let options = field.options;
                                                if (field.key === "name" && chargerTypes.length > 0) {
                                                    options = Array.from(new Set(chargerTypes.map(ct => ct.name)));
                                                }

                                                return (
                                                    <div key={field.key} className={`${field.width === 'half' ? 'w-1/2' : 'w-full'} px - 1 mb - 2`}>
                                                        <label className="mb-1 block text-xs font-medium text-dark dark:text-white">
                                                            {field.label}
                                                        </label>
                                                        {field.type === 'select' ? (
                                                            <SearchableSelect
                                                                options={options || []}
                                                                value={(connector[field.key] as string) || ""}
                                                                onChange={(val) => handleConnectorChange(idx, field.key, val)}
                                                                placeholder="Select Type..."
                                                                className="w-full"
                                                            />
                                                        ) : (
                                                            <div className="relative">
                                                                <input
                                                                    type={field.type}
                                                                    min={field.type === 'number' ? "0" : undefined}
                                                                    value={connector[field.key] || ""}
                                                                    onChange={(e) => handleConnectorChange(idx, field.key, e.target.value)}
                                                                    className={cn(
                                                                        "w-full rounded border-[1.5px] border-stroke bg-white px-2 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                                        (field.key === "tariff" || field.key === "powerRating") && "pr-12"
                                                                    )}
                                                                    placeholder={field.key === "tariff" || field.key === "powerRating" ? "0" : ""}
                                                                    readOnly={field.key === "type"}
                                                                />
                                                                {field.key === "tariff" && (
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                        ₹/kWh
                                                                    </span>
                                                                )}
                                                                {field.key === "powerRating" && (
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                        kW
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
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




                    {/* Station Photos Section */}
                    {station.photos && station.photos.length > 0 && (
                        <div className="pt-6 border-t border-stroke dark:border-dark-3 mb-6">
                            <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white uppercase tracking-wide">
                                Station Photos
                            </h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                {station.photos.map((photo, idx) => {
                                    const fullUrl = resolveImageUrl(photo);
                                    return (
                                        <div key={idx} className="aspect-video rounded-lg bg-gray-100 dark:bg-dark-2 overflow-hidden relative group">
                                            <AuthenticatedImage
                                                src={fullUrl}
                                                alt={`Station photo ${idx + 1} `}
                                                className="h-full w-full object-cover transition-transform hover:scale-105"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stroke dark:border-dark-3 pb-6 sm:pb-0">
                        {station.id !== 0 && station.status === 'Pending' && (
                            <button
                                onClick={handleReject}
                                className="flex-1 rounded-lg bg-red-500 px-6 py-3 font-medium text-white hover:bg-red-600 transition-colors order-3 sm:order-1"
                            >
                                Reject
                            </button>
                        )}
                        <button
                            onClick={() => handleSave()}
                            className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 transition-colors order-1 sm:order-2"
                        >
                            {station.id === 0 ? "Add Station" : "Save Changes"}
                        </button>
                        {station.id !== 0 && station.status === 'Pending' && (
                            <button
                                onClick={() => handleSave('Approved')}
                                disabled={!isSaved}
                                className={cn(
                                    "flex-1 rounded-lg px-6 py-3 font-medium text-white transition-all order-2 sm:order-3",
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
            {/* Custom Delete Confirmation Modal */}
            {networkToDelete && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-dark-2 ring-1 ring-stroke dark:ring-dark-3">
                        <div className="p-6 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-500">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">Confirm Deletion</h3>
                            <p className="text-sm text-body-color dark:text-dark-6">
                                Are you sure you want to delete the network <span className="font-bold text-dark dark:text-white">"{networkToDelete.name}"</span>?
                                <br /> This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex border-t border-stroke dark:border-dark-3">
                            <button
                                onClick={() => setNetworkToDelete(null)}
                                className="flex-1 border-r border-stroke px-4 py-3 font-medium text-dark hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteNetwork}
                                className="flex-1 px-4 py-3 font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

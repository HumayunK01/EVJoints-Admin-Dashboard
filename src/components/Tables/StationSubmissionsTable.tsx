"use client";

import React, { useState, useMemo, useEffect } from "react";
import { StationSubmission, Connector } from "@/lib/api";
import { createPortal } from "react-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    SearchIcon,
    FilterIcon,
    ChevronDownIcon,
    CheckIcon,
    XIcon,
    PencilSquareIcon,
} from "@/assets/icons";
import { PreviewIcon, DownloadIcon } from "@/components/Tables/icons";
import { DateRangeFilter } from "@/components/Tables/DateRangeFilter";

import { NETWORK_NAMES } from "@/data/networks";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";

interface ColumnConfig {
    header: string;
    minWidth?: string;
    accessor?: keyof StationSubmission;
    render?: (item: StationSubmission) => React.ReactNode;
    isConnector?: boolean;
    renderConnector?: (connector: Connector) => React.ReactNode;
    align?: "left" | "center" | "right";
}

interface StationSubmissionsTableProps {
    submissions: StationSubmission[];
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

// --- Dynamic Configuration Constants ---

// Fields to include in the global search
const SEARCH_FIELDS: (keyof StationSubmission)[] = [
    "stationName",
    "stationNumber",
    "userName",
    "userId",
    "networkName",
    "stationType",
    "contactNumber"
];

// Configuration for dynamic filters
interface FilterConfigItem {
    key: keyof StationSubmission;
    label: string;
}

const FILTER_CONFIG: FilterConfigItem[] = [
    { key: "status", label: "Status" },
];

interface PhotoViewerProps {
    photos: string[];
    stationName: string;
    onClose: () => void;
}

function PhotoViewer({ photos, stationName, onClose }: PhotoViewerProps) {
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 dark:bg-gray-dark">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-dark dark:text-white">
                        Photos - {stationName}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-dark hover:text-red-600 dark:text-white"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {photos.map((photo, idx) => (
                        <div key={idx} className="aspect-video rounded-lg bg-gray-100 dark:bg-dark-2 flex items-center justify-center">
                            <p className="text-sm text-gray-500">{photo}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    station: StationSubmission | null;
    onSave: (updated: StationSubmission) => void;
}

function ActionModal({ isOpen, onClose, station, onSave }: ActionModalProps) {
    // Single state object for all station fields
    const [formData, setFormData] = useState<Partial<StationSubmission>>({});
    const [connectors, setConnectors] = useState<Connector[]>([]);

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

        onSave(updated);
        onClose();
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
                    <h3 className="text-xl font-bold text-dark dark:text-white">
                        Edit Station Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-dark hover:text-red-600 dark:text-white"
                    >
                        <XIcon className="h-6 w-6" />
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
                                            <XIcon className="h-4 w-4" />
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
                                                            value={connector[field.key] as string}
                                                            onChange={(e) => handleConnectorChange(idx, field.key, e.target.value)}
                                                            className="w-full rounded border-[1.5px] border-stroke bg-white px-2 py-1.5 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                                        >
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
                            <>
                                <button
                                    onClick={() => handleSave('Approved')}
                                    className="flex-1 rounded-lg bg-green-500 px-6 py-3 font-medium text-white hover:bg-green-600 transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 rounded-lg bg-red-500 px-6 py-3 font-medium text-white hover:bg-red-600 transition-colors"
                                >
                                    Reject
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => handleSave()}
                            className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 transition-colors"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-stroke px-6 py-3 font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StationSubmissionsTable({
    submissions: initialSubmissions,
}: StationSubmissionsTableProps) {
    const [data, setData] = useState<StationSubmission[]>(initialSubmissions);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    // Dynamic Filters State
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Modals
    const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<{ photos: string[]; name: string }>({ photos: [], name: "" });
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState<StationSubmission | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Derived unique values for each filter key
    const filterOptions = useMemo(() => {
        const options: Record<string, string[]> = {};
        FILTER_CONFIG.forEach(({ key }) => {
            const uniqueValues = Array.from(new Set(data.map((item) => String(item[key] || ""))));
            options[key] = uniqueValues.filter(Boolean).sort();
        });
        return options;
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // 1. Search Logic
            const matchesSearch = search === "" || SEARCH_FIELDS.some((field) => {
                const val = item[field];
                return val && String(val).toLowerCase().includes(search.toLowerCase());
            });

            // 2. Dynamic Filters Logic
            const matchesFilters = FILTER_CONFIG.every(({ key }) => {
                const activeValue = activeFilters[key];
                // If no filter selected for this key (or "All"), match everything
                if (!activeValue || activeValue === "All") return true;
                return String(item[key]) === activeValue;
            });

            // 3. Date Range Logic
            const matchesDate =
                (!startDate || new Date(item.submissionDate) >= new Date(startDate)) &&
                (!endDate || new Date(item.submissionDate) <= new Date(endDate));

            return matchesSearch && matchesFilters && matchesDate;
        });
    }, [data, search, activeFilters, startDate, endDate]);

    // Handlers
    const handleFilterChange = (key: string, value: string) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSearch("");
        setStartDate("");
        setEndDate("");
    };



    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const toggleExpand = (id: number) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handlePhotoClick = (photos: string[], stationName: string) => {
        setSelectedPhotos({ photos, name: stationName });
        setPhotoViewerOpen(true);
    };

    const handleActionClick = (station: StationSubmission) => {
        setSelectedStation(station);
        setActionModalOpen(true);
    };

    const handleSaveStation = (updated: StationSubmission) => {
        setData((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
        );
    };

    const handleExport = () => {
        const headers = [
            "ID",
            "Date",
            "Customer Name",
            "Customer Phone",
            "Latitude",
            "Longitude",
            "Network Name",
            "Station Name",
            "Stations ID",
            "Connector Type",
            "Connectors",
            "Power Rating",
            "Tariff",
            "Usage Type",
            "Operational Hours",
            "Photos",
            "Status",
            "EVolts",
            "Approval Date"
        ];

        const rows = filteredData.map((item) => [
            item.id,
            new Date(item.submissionDate).toLocaleDateString(),
            item.userName,
            item.contactNumber,
            item.latitude,
            item.longitude,
            item.networkName,
            item.stationName,
            item.stationNumber || "-",
            Array.from(new Set(item.connectors.map(c => c.type))).join('/'),
            item.connectors.map(c => `${c.count}x ${c.name}`).join(', '),
            item.connectors.map(c => c.powerRating || "-").join(', '),
            item.connectors.map(c => c.tariff || "-").join(', '),
            item.usageType,
            item.operationalHours || "-",
            item.photos.length,
            item.status,
            item.eVolts,
            item.approvalDate ? new Date(item.approvalDate).toLocaleDateString() : "-"
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = "station_submissions.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns: ColumnConfig[] = useMemo(() => [
        { header: "ID", accessor: "id", minWidth: "60px" },
        {
            header: "Date",
            minWidth: "100px",
            render: (item: StationSubmission) => new Date(item.submissionDate).toLocaleDateString()
        },
        {
            header: "Added By",
            minWidth: "120px",
            render: (item: StationSubmission) => (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.addedByType === 'Station Owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                    item.addedByType === 'CPO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {item.addedByType || '-'}
                </span>
            )
        },
        { header: "Customer Name", accessor: "userName", minWidth: "150px", render: (item: StationSubmission) => <span className="text-primary font-medium">{item.userName}</span> },
        { header: "Customer Phone", accessor: "contactNumber", minWidth: "130px" },
        { header: "Latitude", accessor: "latitude", minWidth: "100px" },
        { header: "Longitude", accessor: "longitude", minWidth: "100px" },
        { header: "Network Name", accessor: "networkName", minWidth: "150px", render: (item: StationSubmission) => <span className="font-medium">{item.networkName}</span> },
        { header: "Station Name", accessor: "stationName", minWidth: "180px" },
        { header: "Stations ID", accessor: "stationNumber", minWidth: "130px", render: (item: StationSubmission) => item.stationNumber || "-" },
        {
            header: "Connector Type",
            minWidth: "120px",
            isConnector: true,
            renderConnector: (c: Connector) => c.type
        },
        {
            header: "Connectors",
            minWidth: "150px",
            isConnector: true,
            renderConnector: (c: Connector) => `${c.count}x ${c.name}`
        },
        {
            header: "Power Rating",
            minWidth: "120px",
            isConnector: true,
            renderConnector: (c: Connector) => c.powerRating || "-"
        },
        {
            header: "Tariff",
            minWidth: "100px",
            isConnector: true,
            renderConnector: (c: Connector) => c.tariff || "-"
        },
        {
            header: "Usage Type",
            minWidth: "100px",
            render: (item: StationSubmission) => (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${item.usageType === 'Public' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {item.usageType}
                </span>
            )
        },
        { header: "Operational Hr", accessor: "operationalHours", minWidth: "140px", render: (item: StationSubmission) => item.operationalHours || "-" },
        {
            header: "Photo",
            minWidth: "80px",
            render: (item: StationSubmission) => item.photos.length > 0 ? (
                <button
                    onClick={() => handlePhotoClick(item.photos, item.stationName)}
                    className="text-sm font-medium text-primary hover:underline"
                >
                    {item.photos.length}
                </button>
            ) : <span className="text-gray-500">0</span>
        },
        {
            header: "Status",
            minWidth: "100px",
            render: (item: StationSubmission) => (
                <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === "Approved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : item.status === "Rejected"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                >
                    {item.status}
                </span>
            )
        },
        { header: "EVolts", accessor: "eVolts", minWidth: "80px", align: "center", render: (item: StationSubmission) => <span className="font-bold">{item.status === "Approved" ? item.eVolts : 0}</span> },
        { header: "Approval Date", minWidth: "120px", render: (item: StationSubmission) => item.approvalDate ? new Date(item.approvalDate).toLocaleDateString() : "-" },
        {
            header: "Actions",
            minWidth: "100px",
            render: (item: StationSubmission) => (
                <button
                    onClick={() => handleActionClick(item)}
                    className="text-dark hover:text-primary dark:text-white"
                    title="Edit"
                >
                    <PencilSquareIcon className="h-5 w-5" />
                </button>
            )
        }
    ], [handlePhotoClick, handleActionClick]);

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            {/* Header and Filters */}
            <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">
                    Station Additions
                </h4>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                    {/* Search */}
                    <div className="relative w-full sm:w-auto">
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-dark dark:text-white">
                            <SearchIcon className="h-4 w-4" />
                        </button>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[200px]"
                        />
                    </div>

                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                        {/* Status Filter */}
                        {/* Dynamic Filters */}
                        {FILTER_CONFIG.map((filter) => (
                            <div key={filter.key} className="relative">
                                <select
                                    value={activeFilters[filter.key] || "All"}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="appearance-none rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm font-medium text-dark outline-none hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 pr-8 max-w-[150px]"
                                >
                                    <option value="All">All {filter.label === 'Status' ? 'Status' : filter.label + 's'}</option>
                                    {filterOptions[filter.key]?.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                            </div>
                        ))}

                        {(Object.keys(activeFilters).length > 0 || startDate || endDate || search) && (
                            <button
                                onClick={clearFilters}
                                className="text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400"
                            >
                                Clear
                            </button>
                        )}

                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <FilterIcon className="h-4 w-4" />
                            Date
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <DownloadIcon className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Date Filter Modal */}
            {isFilterOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <DateRangeFilter
                        startDate={startDate}
                        endDate={endDate}
                        onApply={(start, end) => {
                            setStartDate(start);
                            setEndDate(end);
                            setIsFilterOpen(false);
                        }}
                        onCancel={() => setIsFilterOpen(false)}
                        onClear={() => {
                            setStartDate("");
                            setEndDate("");
                        }}
                    />
                </div>,
                document.body
            )}

            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-t border-stroke bg-green-light-7 hover:bg-green-light-7 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-2">
                            {columns.map((col, idx) => (
                                <TableHead
                                    key={idx}
                                    className={`px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap ${col.minWidth ? `min-w-[${col.minWidth}]` : ''}`}
                                    style={{ minWidth: col.minWidth, textAlign: col.align }}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((item) => {
                                const isExpanded = expandedRows.has(item.id);
                                const hasMultipleConnectors = item.connectors.length > 1;

                                return (
                                    <React.Fragment key={item.id}>
                                        <TableRow className="border-t border-stroke dark:border-dark-3">
                                            {columns.map((col, idx) => (
                                                <TableCell key={idx} className="px-4 py-4 dark:border-dark-3" align={col.align}>
                                                    {col.isConnector ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm text-dark dark:text-white">
                                                                {hasMultipleConnectors ? "Multiple" : col.renderConnector?.(item.connectors[0])}
                                                            </div>
                                                            {hasMultipleConnectors && (
                                                                <button
                                                                    onClick={() => toggleExpand(item.id)}
                                                                    className="text-primary hover:text-primary/80"
                                                                >
                                                                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-dark dark:text-white">
                                                            {col.render ? col.render(item) : (item[col.accessor as keyof StationSubmission] as React.ReactNode)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>

                                        {/* Expanded Connector Rows - Dynamic */}
                                        {isExpanded && hasMultipleConnectors && item.connectors.map((connector, cIdx) => (
                                            <TableRow key={`${item.id}-c-${cIdx}`} className="border-t border-stroke bg-gray-50 dark:border-dark-3 dark:bg-dark-3">
                                                {columns.map((col, idx) => (
                                                    <TableCell key={idx} className="px-4 py-2 dark:border-dark-3">
                                                        {col.isConnector ? (
                                                            <div className="text-sm text-dark dark:text-white pl-0">
                                                                {col.renderConnector?.(connector)}
                                                            </div>
                                                        ) : (
                                                            // Empty cells for non-connector columns to maintain alignment
                                                            <div />
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <p className="text-sm text-dark dark:text-white">
                                        No submissions found.
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-4 border-t border-stroke px-4 py-4 dark:border-dark-3 sm:px-6">
                <div className="flex items-center gap-2">
                    <select
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        className="bg-transparent text-sm font-medium text-dark outline-none dark:text-white"
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-dark dark:text-white">
                        {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of{" "}
                        {filteredData.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Photo Viewer Modal */}
            {photoViewerOpen && mounted && createPortal(
                <PhotoViewer
                    photos={selectedPhotos.photos}
                    stationName={selectedPhotos.name}
                    onClose={() => setPhotoViewerOpen(false)}
                />,
                document.body
            )}

            {/* Action Modal */}
            {actionModalOpen && mounted && createPortal(
                <ActionModal
                    isOpen={actionModalOpen}
                    onClose={() => setActionModalOpen(false)}
                    station={selectedStation}
                    onSave={handleSaveStation}
                />,
                document.body
            )}
        </div>
    );
}

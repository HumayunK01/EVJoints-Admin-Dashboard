"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ChargingStation, Connector, getChargingStationsPaginated, updateStation, createStation, massUploadStations, downloadChargingStations, StationSubmission } from "@/lib/api";
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
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    ChevronDown,
    Check,
    X,
    Pencil,
    Download,
    Upload,
    ImageOff
} from "lucide-react";
import { DateRangeFilter } from "@/components/Tables/DateRangeFilter";
// reusing ActionModal as ChargingStation extends StationSubmission
import ActionModal from "@/components/StationSubmissions/ActionModal";
import { PaginationSelect } from "@/components/ui/pagination-select";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

import { cn, resolveImageUrl, formatDate, formatTime } from "@/lib/utils";

interface ColumnConfig {
    header: string;
    minWidth?: string;
    accessor?: keyof ChargingStation;
    render?: (item: ChargingStation) => React.ReactNode;
    isConnector?: boolean;
    renderConnector?: (connector: Connector) => React.ReactNode;
    align?: "left" | "center" | "right";
}

interface ChargingStationsTableProps {
    initialData: ChargingStation[];
    initialPagination: {
        total: number;
        page: number;
        limit: number;
    };
}

// --- Dynamic Configuration Constants ---

// Fields to include in the global search (client-side hint, actual search is backend)
const SEARCH_FIELDS: (keyof ChargingStation)[] = [
    "stationName",
    "stationNumber",
    "networkName",
    "stationType",
    "contactNumber",
    "address",
    "city",
    "state"
];

// Configuration for dynamic filters
interface FilterConfigItem {
    key: string; // key for API filter
    label: string;
    options?: string[];
}

const FILTER_CONFIG: FilterConfigItem[] = [
    { key: "status", label: "Status", options: ["Approved", "Rejected", "Pending", "All"] },
    { key: "usageType", label: "Usage Type", options: ["Public", "Private", "All"] },
    // Network ID will be fetched or we can just use dynamic values from data
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatTo12Hour = (timeStr: string) => {
    if (!timeStr) return "-";
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const formatNetworkName = (name: string | null | undefined) => {
    if (!name) return "-";
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const formatOperationalHours = (range: string | null | undefined) => {
    if (!range || range === "-" || !range.includes(" - ")) return range || "-";
    const [start, end] = range.split(" - ");
    return `${formatTo12Hour(start)} - ${formatTo12Hour(end)}`;
};

// ============================================================================
// PHOTO VIEWER COMPONENT
// ============================================================================

// Internal component to handle authenticated image fetching
function AuthenticatedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [imageSrc, setImageSrc] = React.useState<string | null>(null);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        let active = true;
        const loadImage = async () => {
            if (!src) return;

            // If it's not our API or doesn't need auth, just set it
            if (!src.includes('devapi.evjoints.com') && !src.includes('api/attachment')) {
                setImageSrc(src);
                return;
            }

            try {
                // Get token
                let token = "";
                if (typeof document !== "undefined") {
                    const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
                    if (match) token = match[2];
                }

                const headers: HeadersInit = {};
                if (token) headers["Authorization"] = `Bearer ${token}`;

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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-gray-100 dark:bg-dark-2">
                <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">Failed to load</span>
            </div>
        );
    }

    if (!imageSrc) {
        return <div className="h-full w-full bg-gray-100 dark:bg-dark-2 animate-pulse" />;
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
}

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
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {photos.map((photo, idx) => {
                        const fullUrl = resolveImageUrl(photo);
                        return (
                            <div key={idx} className="aspect-video rounded-lg bg-gray-100 dark:bg-dark-2 overflow-hidden relative group">
                                <AuthenticatedImage
                                    src={fullUrl}
                                    alt={`Station photo ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


export default function ChargingStationsTable({
    initialData,
    initialPagination,
}: ChargingStationsTableProps) {
    const [data, setData] = useState<ChargingStation[]>(initialData);
    const [currentPage, setCurrentPage] = useState(initialPagination.page);
    const [rowsPerPage, setRowsPerPage] = useState(initialPagination.limit);
    const [totalRecords, setTotalRecords] = useState(initialPagination.total);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [savedStationIds, setSavedStationIds] = useState<Set<number>>(new Set());

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
    const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

    // Ref to track current page for race condition handling
    const currentPageRef = useRef(currentPage);

    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch page data from backend
    const fetchPage = async (page: number, limit: number, showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const filters: any = {
                status: activeFilters["status"],
                usageType: activeFilters["usageType"],
                search: search || undefined
            };

            // Add other filters if present
            if (activeFilters["networkId"]) filters.networkId = activeFilters["networkId"];
            // Add date filters (though API might expect them differently, adapter handles it)
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            // Map table filter keys to API keys if different
            // In loop below

            const response = await getChargingStationsPaginated(
                page,
                limit,
                filters
            );

            // Prevent race condition
            if (!showLoading && response.pagination.page !== currentPageRef.current) {
                return;
            }

            setData(response.data);
            setTotalRecords(response.pagination.total);
            if (showLoading) setCurrentPage(response.pagination.page);
        } catch (error) {
            console.error("Error fetching charging stations:", error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Derived unique values for each filter key (optional, from current page data only or use fixed)
    const filterOptions = useMemo(() => {
        const options: Record<string, string[]> = {};
        // We can dynamically add network names etc.
        const networks = Array.from(new Set(data.map(item => item.networkName))).filter(Boolean).sort();
        options["networkName"] = networks;
        return options;
    }, [data]);


    // Auto-refresh data every 30 seconds
    const hasActiveFilters = useMemo(
        () => search || startDate || endDate || Object.keys(activeFilters).length > 0,
        [search, startDate, endDate, activeFilters]
    );

    useEffect(() => {
        const interval = setInterval(() => {
            if (!hasActiveFilters && !actionModalOpen && !photoViewerOpen && !isFilterOpen && !isLoading) {
                fetchPage(currentPage, rowsPerPage, false);
            }
        }, 30000); // 30s instead of 3s to reduce load

        return () => clearInterval(interval);
    }, [currentPage, rowsPerPage, hasActiveFilters, actionModalOpen, photoViewerOpen, isFilterOpen, isLoading]);

    // Triggers for refetch
    useEffect(() => {
        if (Object.keys(activeFilters).length > 0) {
            fetchPage(1, rowsPerPage);
        }
    }, [activeFilters]);

    useEffect(() => {
        if (startDate || endDate) {
            fetchPage(1, rowsPerPage);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        if (search) {
            fetchPage(1, rowsPerPage);
        }
    }, [search]);

    const handleFilterChange = (key: string, value: string) => {
        setActiveFilters(prev => {
            const next = { ...prev };
            if (value === "All") {
                delete next[key];
            } else {
                next[key] = value;
            }
            return next;
        });
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSearch("");
        setStartDate("");
        setEndDate("");
        fetchPage(1, rowsPerPage);
    };

    const totalPages = Math.ceil(totalRecords / rowsPerPage);

    const navigateToPage = (newPage: number) => {
        fetchPage(newPage, rowsPerPage);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) navigateToPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) navigateToPage(currentPage - 1);
    };

    const handleRowsPerPageChange = (newLimit: number) => {
        setRowsPerPage(newLimit);
        fetchPage(1, newLimit);
    };

    const toggleExpand = (id: number) => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handlePhotoClick = (photos: string[], stationName: string) => {
        setSelectedPhotos({ photos, name: stationName });
        setPhotoViewerOpen(true);
    };

    const handleActionClick = (station: ChargingStation) => {
        setSelectedStation(station);
        setActionModalOpen(true);
    };

    const handleAddStationClick = () => {
        const newStation: ChargingStation = {
            id: 0,
            stationName: "",
            stationNumber: "",
            userName: null,
            networkName: "",
            usageType: "Public",
            latitude: 0,
            longitude: 0,
            contactNumber: "",
            status: "Pending",
            submissionDate: new Date().toISOString(),
            photos: [],
            connectors: [],
            eVolts: 0,
            addedByType: "CPO",
            operationalHours: "",
            address: ""
        };
        setSelectedStation(newStation);
        setActionModalOpen(true);
    };

    // Note: ActionModal passes StationSubmission, which ChargeStation extends.
    const handleSaveStation = async (updated: StationSubmission, action: 'SAVE' | 'APPROVE' | 'REJECT' = 'SAVE') => {
        try {
            if (updated.id === 0) {
                // CREATE Mode
                await createStation(updated);
                alert("Station created successfully!");
                setActionModalOpen(false); // Close modal on create
            } else {
                // EDIT Mode
                await updateStation(updated.id, updated, action);

                if (action === "SAVE") {
                    setSavedStationIds(prev => new Set(prev).add(updated.id));
                }
            }

            // Refresh data
            await fetchPage(currentPage, rowsPerPage, false);
            console.log(`Station operation (${action}) successful`);

        } catch (error) {
            console.error(`Failed to ${action} station:`, error);
            alert(`Failed to ${action.toLowerCase()} station. Please try again.`);
        }
    };

    const handleExport = async () => {
        try {
            await downloadChargingStations(
                activeFilters["status"],
                activeFilters["usageType"],
                activeFilters["networkId"],
                undefined, // addedBy
                undefined, // chargerType
                activeFilters["stationType"],
                startDate || undefined,
                endDate || undefined,
                search || undefined
            );
        } catch (error) {
            console.error("Failed to export stations:", error);
            alert("Failed to export stations. Please try again.");
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const result = await massUploadStations(file);
            let message = result.message;
            if (result.summary) {
                message += `\nSuccess: ${result.summary.successful}\nFailed: ${result.summary.failed}`;
            }
            if (result.failedRows && result.failedRows.length > 0) {
                message += `\n\nCheck console for details on failed rows.`;
                console.warn("Failed Rows:", result.failedRows);
            }
            alert(message);
            await fetchPage(currentPage, rowsPerPage, false);
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const columns: ColumnConfig[] = useMemo(() => [
        { header: "ID", accessor: "id", minWidth: "60px" },
        {
            header: "Date",
            minWidth: "100px",
            render: (item) => (
                <div className="text-sm text-dark dark:text-white">
                    {formatDate(item.submissionDate)}
                </div>
            )
        },
        {
            header: "Time",
            minWidth: "120px",
            render: (item) => (
                <div className="text-sm text-dark dark:text-white">
                    {formatTime(item.submissionDate)}
                </div>
            )
        },
        { header: "Station Name", accessor: "stationName", minWidth: "180px" },
        { header: "Station ID", accessor: "stationNumber", minWidth: "130px", render: (item) => item.stationNumber || "-" },
        { header: "Network", accessor: "networkName", minWidth: "150px", render: (item) => formatNetworkName(item.networkName) },
        { header: "Address", accessor: "address", minWidth: "350px", render: (item) => item.address || "-" },
        {
            header: "Connector Type",
            minWidth: "120px",
            isConnector: true,
            renderConnector: (c: Connector) => c.type || "-"
        },
        {
            header: "Connectors",
            minWidth: "150px",
            isConnector: true,
            renderConnector: (c: Connector) => c.count
        },
        {
            header: "Power",
            minWidth: "100px",
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
            header: "Usage",
            minWidth: "100px",
            render: (item) => (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${item.usageType === 'Public' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {item.usageType}
                </span>
            )
        },
        { header: "Op. Hours", accessor: "operationalHours", minWidth: "140px", render: (item) => formatOperationalHours(item.operationalHours) },
        {
            header: "Photo",
            minWidth: "80px",
            render: (item) => (item.photos || []).length > 0 ? (
                <button
                    onClick={() => handlePhotoClick(item.photos || [], item.stationName)}
                    className="text-sm font-medium text-primary hover:underline"
                >
                    {(item.photos || []).length}
                </button>
            ) : <span className="text-gray-500">0</span>
        },
        {
            header: "Status",
            minWidth: "120px",
            render: (item) => (
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

        {
            header: "Approval Date",
            minWidth: "120px",
            render: (item) => item.approvalDate ? (
                <span className="text-sm text-dark dark:text-white whitespace-nowrap">
                    {formatDate(item.approvalDate)}
                </span>
            ) : <span className="text-sm text-gray-400">-</span>
        },
        {
            header: "Approval Time",
            minWidth: "100px",
            render: (item) => item.approvalDate ? (
                <span className="text-sm text-dark dark:text-white whitespace-nowrap">
                    {formatTime(item.approvalDate)}
                </span>
            ) : <span className="text-sm text-gray-400">-</span>
        },
        {
            header: "Approved by",
            minWidth: "150px",
            render: (item) => (
                <span className="text-sm text-dark dark:text-white whitespace-nowrap block">
                    {item.approvedBy || "-"}
                </span>
            )
        },
        {
            header: "Actions",
            minWidth: "100px",
            render: (item) => (
                <button
                    onClick={() => handleActionClick(item)}
                    className="text-dark hover:text-primary dark:text-white"
                    title="Edit"
                >
                    <Pencil className="h-5 w-5" />
                </button>
            )
        }
    ], [mounted]);

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            {/* Header and Filters */}
            <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">
                    Charging Stations
                </h4>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-center sm:gap-2 sm:flex-wrap">
                    {/* Search */}
                    <div className="relative col-span-2 w-full sm:w-auto">
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-dark dark:text-white">
                            <Search className="h-4 w-4" />
                        </button>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[200px]"
                        />
                    </div>

                    <div className="contents sm:flex sm:items-center sm:gap-2">

                        {/* Status Filter */}
                        <FilterDropdown
                            value={activeFilters["status"] || "All"}
                            options={FILTER_CONFIG.find(f => f.key === "status")?.options?.map(opt => ({ label: opt, value: opt })) || []}
                            onChange={(val) => handleFilterChange("status", val)}
                            minWidth="120px"
                            className="w-full sm:w-[120px]"
                        />

                        {/* Add Station Button */}



                        {/* Usage Filter */}
                        <FilterDropdown
                            value={activeFilters["usageType"] || "All"}
                            options={FILTER_CONFIG.find(f => f.key === "usageType")?.options?.map(opt => ({ label: opt, value: opt })) || []}
                            onChange={(val) => handleFilterChange("usageType", val)}
                            minWidth="120px"
                            className="w-full sm:w-[120px]"
                        />

                        {/* Date Filter */}
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="col-span-1 flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <Filter className="h-4 w-4" />
                            Date
                        </button>

                        {(Object.keys(activeFilters).length > 0 || startDate || endDate || search) && (
                            <button
                                onClick={clearFilters}
                                className="col-span-2 sm:col-span-1 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 text-center sm:text-left py-1"
                            >
                                Clear
                            </button>
                        )}


                        {/* Add Station Button */}
                        <button
                            onClick={handleAddStationClick}
                            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-colors whitespace-nowrap w-full sm:w-auto"
                        >
                            <span>+ Add Station</span>
                        </button>

                        {/* Hidden File Input for Import */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                        />

                        {/* Import Button */}
                        <button
                            onClick={handleImportClick}
                            className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 w-full sm:w-auto"
                        >
                            <Upload className="h-4 w-4" />
                            Import
                        </button>

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 w-full sm:w-auto"
                        >
                            <Download className="h-4 w-4" />
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
                                    className={`px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap text-center ${col.minWidth ? `min-w-[${col.minWidth}]` : ''}`}
                                    style={{ minWidth: col.minWidth }}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? (
                            data.map((item) => {
                                const isExpanded = expandedRows.has(item.id);
                                const hasMultipleConnectors = item.connectors.length > 1;

                                return (
                                    <React.Fragment key={item.id}>
                                        <TableRow className={`border-t border-stroke dark:border-dark-3 ${expandedRows.has(item.id) ? "bg-gray-50 dark:bg-dark-2" : "odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-white/5"} hover:bg-gray-50 dark:hover:bg-white/5 transition-colors`}>
                                            {columns.map((col, idx) => (
                                                <TableCell key={idx} className="px-4 py-4 dark:border-dark-3 align-middle" align="center">
                                                    {col.isConnector ? (
                                                        <div className="flex items-center justify-center">
                                                            <div className="text-sm text-dark dark:text-white">
                                                                {item.connectors.length === 0
                                                                    ? "-"
                                                                    : hasMultipleConnectors
                                                                        ? "Multiple"
                                                                        : col.renderConnector?.(item.connectors[0])
                                                                }
                                                            </div>
                                                            {hasMultipleConnectors && (
                                                                <button
                                                                    onClick={() => toggleExpand(item.id)}
                                                                    className="text-primary hover:text-primary/80"
                                                                >
                                                                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-dark dark:text-white">
                                                            {col.render ? col.render(item) : (item[col.accessor as keyof ChargingStation] as React.ReactNode)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>

                                        {/* Expanded Connector Rows */}
                                        {isExpanded && hasMultipleConnectors && item.connectors.map((connector, cIdx) => (
                                            <TableRow key={`${item.id}-c-${cIdx}`} className="border-t border-stroke bg-gray-50 dark:border-dark-3 dark:bg-dark-3">
                                                {columns.map((col, idx) => (
                                                    <TableCell key={idx} className="px-4 py-2 dark:border-dark-3">
                                                        {col.isConnector ? (
                                                            <div className="text-sm text-dark dark:text-white text-center">
                                                                {col.renderConnector?.(connector)}
                                                            </div>
                                                        ) : (
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
                                        No stations found.
                                    </p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stroke px-4 py-4 dark:border-dark-3 sm:px-6">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-dark dark:text-white sm:hidden">Rows per page:</span>
                    <PaginationSelect
                        value={rowsPerPage}
                        options={[10, 15, 20, 50, 100]}
                        onChange={handleRowsPerPageChange}
                        direction="up"
                    />
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto sm:gap-4">
                    <span className="text-sm text-dark dark:text-white">
                        Page {currentPage} of {totalPages || 1}
                        <span className="ml-2 text-gray-400">({totalRecords} items)</span>
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke text-dark hover:bg-gray-100 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke text-dark hover:bg-gray-100 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {mounted && photoViewerOpen && createPortal(
                <PhotoViewer
                    photos={selectedPhotos.photos}
                    stationName={selectedPhotos.name}
                    onClose={() => setPhotoViewerOpen(false)}
                />,
                document.body
            )}

            {mounted && actionModalOpen && selectedStation && createPortal(
                <ActionModal
                    isOpen={actionModalOpen}
                    onClose={() => setActionModalOpen(false)}
                    station={selectedStation}
                    onSave={handleSaveStation as any} // Cast safely as ChargingStation matches
                    isSaved={savedStationIds.has(selectedStation.id)}
                />,
                document.body
            )}
        </div>
    );
}

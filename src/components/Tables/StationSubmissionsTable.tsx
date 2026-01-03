"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    ChevronDown,
    Check,
    X,
    Pencil,
    Download,
    ImageOff
} from "lucide-react";
import { DateRangeFilter } from "@/components/Tables/DateRangeFilter";
import ActionModal from "@/components/StationSubmissions/ActionModal";
import { PaginationSelect } from "@/components/ui/pagination-select";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

import { NETWORK_NAMES } from "@/data/networks";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn, formatDate, formatTime } from "@/lib/utils";

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
    initialData: StationSubmission[];
    initialPagination: {
        total: number;
        page: number;
        limit: number;
    };
}

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
    options?: string[];
}

const FILTER_CONFIG: FilterConfigItem[] = [
    { key: "status", label: "Status", options: ["Pending", "Approved", "Rejected"] },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Removed local date/time helpers in favor of @/lib/utils


const formatTo12Hour = (timeStr: string) => {
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
                    {photos.map((photo, idx) => (
                        <div key={idx} className="aspect-video rounded-lg bg-gray-100 dark:bg-dark-2 overflow-hidden relative group">
                            {photo.match(/\.(jpg|jpeg|png|gif|webp)$/i) || photo.startsWith('http') || photo.includes('IMAGE/') ? (
                                <img
                                    src={
                                        photo.startsWith('http') ? photo :
                                            photo.startsWith('IMAGE/') ? `https://devapi.evjoints.com/${photo}` :
                                                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/${photo}`
                                    }
                                    alt={`Station photo ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-gray-100 dark:bg-dark-2 ${photo.match(/\.(jpg|jpeg|png|gif|webp)$/i) || photo.startsWith('http') || photo.includes('IMAGE/') ? 'hidden' : ''}`}>
                                <ImageOff className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500">Image not available</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}



export default function StationSubmissionsTable({
    initialData,
    initialPagination,
}: StationSubmissionsTableProps) {
    const [data, setData] = useState<StationSubmission[]>(initialData);
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
    const [selectedStation, setSelectedStation] = useState<StationSubmission | null>(null);

    // Ref to track current page for race condition handling
    const currentPageRef = useRef(currentPage);

    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch page data from backend using API utility
    const fetchPage = async (page: number, limit: number, showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const { getStationSubmissionsPaginated } = await import("@/lib/api");

            // Get the current status filter value
            const statusFilter = activeFilters["status"] || undefined;

            const response = await getStationSubmissionsPaginated(
                page,
                limit,
                statusFilter,
                startDate || undefined,
                endDate || undefined,
                search || undefined
            );

            // Prevent race condition: If this was a background refresh (showLoading=false)
            // but the user has navigated away (currentPage changed), ignore the result.
            if (!showLoading && response.pagination.page !== currentPageRef.current) {
                return;
            }

            setData(response.data);
            setTotalRecords(response.pagination.total);
            if (showLoading) setCurrentPage(response.pagination.page);
        } catch (error) {
            console.error("Error fetching stations:", error);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Server-side pagination (when no filters active)
    const hasActiveFilters = useMemo(
        () => search || startDate || endDate || Object.keys(activeFilters).length > 0,
        [search, startDate, endDate, activeFilters]
    );

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Only refresh if no filters are active (as filtering is client-side on current page data)
            // and no modals are open to prevent UX disruption
            // AND not currently loading (to prevent race conditions with manual navigation)
            if (!hasActiveFilters && !actionModalOpen && !photoViewerOpen && !isFilterOpen && !isLoading) {
                fetchPage(currentPage, rowsPerPage, false);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentPage, rowsPerPage, hasActiveFilters, actionModalOpen, photoViewerOpen, isFilterOpen, isLoading]);

    // Re-fetch when status filter changes
    useEffect(() => {
        if (activeFilters["status"]) {
            fetchPage(1, rowsPerPage);
        }
    }, [activeFilters]);

    // Re-fetch when date filters change
    useEffect(() => {
        if (startDate || endDate) {
            fetchPage(1, rowsPerPage);
        }
    }, [startDate, endDate]);

    // Re-fetch when search changes
    useEffect(() => {
        if (search) {
            fetchPage(1, rowsPerPage);
        }
    }, [search]);

    // Derived unique values for each filter key (from current page data only)
    const filterOptions = useMemo(() => {
        const options: Record<string, string[]> = {};
        FILTER_CONFIG.forEach(({ key }) => {
            const uniqueValues = Array.from(new Set(data.map((item) => String(item[key] || ""))));
            options[key] = uniqueValues.filter(Boolean).sort();
        });
        return options;
    }, [data]);

    // Use server data directly - no client-side filtering
    const currentData = data;

    // Handlers
    const handleFilterChange = (key: string, value: string) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSearch("");
        setStartDate("");
        setEndDate("");
        fetchPage(1, rowsPerPage); // Re-fetch without filters
    };

    // Always use server-side totals
    const totalPages = Math.ceil(totalRecords / rowsPerPage);

    // Helper function to handle page navigation - always server-side
    const navigateToPage = (newPage: number) => {
        fetchPage(newPage, rowsPerPage);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            navigateToPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            navigateToPage(currentPage - 1);
        }
    };

    const handleRowsPerPageChange = (newLimit: number) => {
        setRowsPerPage(newLimit);
        fetchPage(1, newLimit);
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

    const handleSaveStation = async (updated: StationSubmission, action: 'SAVE' | 'APPROVE' | 'REJECT' = 'SAVE') => {
        try {
            const { updateStation } = await import("@/lib/api");

            // Find original to see what changed
            const original = data.find(item => item.id === updated.id);
            if (!original) return;

            // Call unified update API
            await updateStation(updated.id, updated, action);

            if (action === "SAVE") {
                setSavedStationIds(prev => new Set(prev).add(updated.id));
            }

            // Refresh data
            await fetchPage(currentPage, rowsPerPage);
            console.log(`Station ${action.toLowerCase()}ed successfully`);

        } catch (error) {
            console.error(`Failed to ${action} station:`, error);
            alert(`Failed to ${action.toLowerCase()} station. Please try again.`);
        }
    };

    const handleExport = async () => {
        try {
            const { downloadStationSubmissions } = await import("@/lib/api");

            // Get the current status filter value
            const statusFilter = activeFilters["status"] || undefined;

            await downloadStationSubmissions(
                statusFilter,
                startDate || undefined,
                endDate || undefined,
                search || undefined
            );
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to download CSV. Please try again.");
        }
    };

    const columns: ColumnConfig[] = useMemo(() => [
        { header: "ID", accessor: "id", minWidth: "60px" },
        {
            header: "Date",
            minWidth: "120px",
            render: (item: StationSubmission) => (
                <span className="text-sm text-dark dark:text-white">
                    {mounted ? formatDate(item.submissionDate) : "-"}
                </span>
            )
        },
        {
            header: "Time",
            minWidth: "100px",
            render: (item: StationSubmission) => (
                <span className="text-sm text-dark dark:text-white">
                    {mounted ? formatTime(item.submissionDate) : "-"}
                </span>
            )
        },
        {
            header: "Added By",
            minWidth: "120px",
            render: (item: StationSubmission) => {
                const type = item.addedByType?.toLowerCase();
                let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

                if (type === 'station owner') {
                    colorClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400';
                } else if (type === 'cpo') {
                    colorClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
                } else if (type === 'ev owner') {
                    colorClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
                }

                return (
                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${colorClass}`}>
                        {item.addedByType || '-'}
                    </span>
                );
            }
        },
        { header: "Customer Name", accessor: "userName", minWidth: "150px", render: (item: StationSubmission) => item.userName || "-" },
        { header: "Customer Phone", accessor: "contactNumber", minWidth: "130px", render: (item: StationSubmission) => item.contactNumber || "-" },
        { header: "Latitude", accessor: "latitude", minWidth: "100px" },
        { header: "Longitude", accessor: "longitude", minWidth: "100px" },
        { header: "Network Name", accessor: "networkName", minWidth: "150px", render: (item: StationSubmission) => formatNetworkName(item.networkName) },
        { header: "Station Name", accessor: "stationName", minWidth: "180px" },
        { header: "Stations ID", accessor: "stationNumber", minWidth: "130px", render: (item: StationSubmission) => item.stationNumber || "-" },
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
            renderConnector: (c: Connector) => `${c.count}x ${c.name || "-"}`
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
        { header: "Operational Hr", accessor: "operationalHours", minWidth: "140px", render: (item: StationSubmission) => formatOperationalHours(item.operationalHours) },
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
            minWidth: "160px",
            render: (item: StationSubmission) => (
                <div className="flex flex-col items-center gap-1.5">
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
                    {item.status === "Rejected" && (item.reason || item.statusReason) && (item.reason !== '-' && item.statusReason !== '-') && (
                        <div className="flex items-center justify-center gap-1.5">
                            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                            <span className="text-xs font-medium text-red-600 dark:text-red-400 leading-tight">
                                {item.reason || item.statusReason}
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        { header: "EVolts", accessor: "eVolts", minWidth: "80px", align: "center", render: (item: StationSubmission) => <span className="font-bold">{item.status === "Approved" ? item.eVolts : 0}</span> },
        {
            header: "Approval Date",
            minWidth: "120px",
            render: (item: StationSubmission) => mounted && item.approvalDate ? (
                <span className="text-sm text-dark dark:text-white whitespace-nowrap">
                    {formatDate(item.approvalDate)}
                </span>
            ) : <span className="text-sm text-gray-400">-</span>
        },
        {
            header: "Approval Time",
            minWidth: "120px",
            render: (item: StationSubmission) => mounted && item.approvalDate ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(item.approvalDate)}
                </span>
            ) : <span className="text-sm text-gray-400">-</span>
        },
        {
            header: "Actions",
            minWidth: "100px",
            render: (item: StationSubmission) => (
                <button
                    onClick={() => handleActionClick(item)}
                    disabled={item.status === 'Rejected'}
                    className={`text-dark hover:text-primary dark:text-white ${item.status === 'Rejected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={item.status === 'Rejected' ? "Cannot edit rejected station" : "Edit"}
                >
                    <Pencil className="h-5 w-5" />
                </button>
            )
        }
    ], [handlePhotoClick, handleActionClick, mounted]);

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            {/* Header and Filters */}
            <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">
                    Station Additions
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
                        {/* Dynamic Filters - Side by Side on Mobile */}
                        {FILTER_CONFIG.map((filter) => (
                            <div key={filter.key} className="relative col-span-1 w-full sm:w-auto">
                                <FilterDropdown
                                    value={activeFilters[filter.key] || "All"}
                                    options={[
                                        { label: `All ${filter.label === 'Status' ? 'Status' : filter.label + 's'}`, value: "All" },
                                        ...(filter.options || filterOptions[filter.key] || []).map(opt => ({
                                            label: opt,
                                            value: opt
                                        }))
                                    ]}
                                    onChange={(val) => handleFilterChange(filter.key, val)}
                                    minWidth="100%"
                                    className="w-full sm:w-[150px]"
                                />
                            </div>
                        ))}

                        {/* Date Filter - Side by Side with Clear or on its own */}
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

                        {/* Export Button - Full Width on Mobile */}
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
                        {currentData.length > 0 ? (
                            currentData.map((item) => {
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
                                                            <div className="text-sm text-dark dark:text-white text-center">
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
                    {isLoading && (
                        <span className="hidden sm:inline text-sm font-medium text-primary animate-pulse">
                            Loading...
                        </span>
                    )}
                    <p className="text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                        {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
                        {totalRecords}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-transparent text-dark hover:bg-gray-2 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-transparent text-dark hover:bg-gray-2 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronRight className="h-4 w-4" />
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
            {mounted && selectedStation && createPortal(
                <ActionModal
                    isOpen={actionModalOpen}
                    onClose={() => setActionModalOpen(false)}
                    station={selectedStation}
                    onSave={handleSaveStation}
                    isSaved={savedStationIds.has(selectedStation.id)}
                />,
                document.body
            )}
        </div>
    );
}

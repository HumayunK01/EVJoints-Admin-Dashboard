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
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    ChevronDown,
    Check,
    X,
    Pencil,
    Download
} from "lucide-react";
import { DateRangeFilter } from "@/components/Tables/DateRangeFilter";
import ActionModal from "@/components/StationSubmissions/ActionModal";

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
}

const FILTER_CONFIG: FilterConfigItem[] = [
    { key: "status", label: "Status" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-GB', { timeZone: 'UTC' });
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
const formatOptionalDate = (dateString: string | null | undefined) => dateString ? formatDate(dateString) : "-";
const formatOptionalTime = (dateString: string | null | undefined) => dateString ? formatTime(dateString) : "-";

const formatTo12Hour = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
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
                        <div key={idx} className="aspect-video rounded-lg bg-gray-100 dark:bg-dark-2 flex items-center justify-center">
                            <p className="text-sm text-gray-500">{photo}</p>
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

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch page data from backend using API utility
    const fetchPage = async (page: number, limit: number, showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const { getStationSubmissionsPaginated } = await import("@/lib/api");
            const response = await getStationSubmissionsPaginated(page, limit);
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
            if (!hasActiveFilters && !actionModalOpen && !photoViewerOpen && !isFilterOpen) {
                fetchPage(currentPage, rowsPerPage, false);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [currentPage, rowsPerPage, hasActiveFilters, actionModalOpen, photoViewerOpen, isFilterOpen]);

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

    const totalPages = hasActiveFilters
        ? Math.ceil(filteredData.length / rowsPerPage)
        : Math.ceil(totalRecords / rowsPerPage);

    const currentData = hasActiveFilters
        ? filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
        : filteredData;

    // Helper function to handle page navigation
    const navigateToPage = (newPage: number) => {
        if (!hasActiveFilters) {
            fetchPage(newPage, rowsPerPage);
        } else {
            setCurrentPage(newPage);
        }
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

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLimit = Number(e.target.value);
        setRowsPerPage(newLimit);
        if (!hasActiveFilters) {
            fetchPage(1, newLimit);
        } else {
            setCurrentPage(1);
        }
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

    const handleExport = () => {
        const headers = [
            "ID", "Date", "Time", "Customer Name", "Customer Phone", "Lat", "Long",
            "Network", "Station Name", "Station ID", "Connector Types", "Connectors",
            "Power", "Tariff", "Usage", "Hours", "Photos", "Status", "EVolts",
            "Approval Date", "Approval Time"
        ];

        const rows = filteredData.map((item) => [
            item.id,
            formatDate(item.submissionDate),
            formatTime(item.submissionDate),
            item.userName || "-",
            item.contactNumber || "-",
            item.latitude,
            item.longitude,
            item.networkName,
            item.stationName,
            item.stationNumber || "-",
            Array.from(new Set(item.connectors.map(c => c.type || "-"))).join('/'),
            item.connectors.map(c => `${c.count}x ${c.name}`).join(', '),
            item.connectors.map(c => c.powerRating || "-").join(', '),
            item.connectors.map(c => c.tariff || "-").join(', '),
            item.usageType,
            item.operationalHours || "-",
            item.photos.length,
            item.status,
            item.eVolts,
            formatOptionalDate(item.approvalDate),
            formatOptionalTime(item.approvalDate)
        ]);

        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "station_submissions.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns: ColumnConfig[] = useMemo(() => [
        { header: "ID", accessor: "id", minWidth: "60px" },
        {
            header: "Date",
            minWidth: "120px",
            render: (item: StationSubmission) => (
                <span className="text-sm text-dark dark:text-white">
                    {formatDate(item.submissionDate)}
                </span>
            )
        },
        {
            header: "Time",
            minWidth: "100px",
            render: (item: StationSubmission) => (
                <span className="text-sm text-dark dark:text-white">
                    {formatTime(item.submissionDate)}
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
        { header: "Network Name", accessor: "networkName", minWidth: "150px", render: (item: StationSubmission) => item.networkName },
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
            render: (item: StationSubmission) => item.approvalDate ? (
                <span className="text-sm text-dark dark:text-white whitespace-nowrap">
                    {formatDate(item.approvalDate)}
                </span>
            ) : <span className="text-sm text-gray-400">-</span>
        },
        {
            header: "Approval Time",
            minWidth: "120px",
            render: (item: StationSubmission) => item.approvalDate ? (
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
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
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
                            <Filter className="h-4 w-4" />
                            Date
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
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
                        ) : isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
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
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-dark dark:text-white">
                        {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, hasActiveFilters ? filteredData.length : totalRecords)} of{" "}
                        {hasActiveFilters ? filteredData.length : totalRecords}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronRight className="h-5 w-5" />
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

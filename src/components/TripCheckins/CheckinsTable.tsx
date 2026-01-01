"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { TripCheckin, LocationCoordinates } from "@/lib/api";
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
    ChevronDown,
    Fuel,
    PlugZap,
    Download
} from "lucide-react";
import LocationViewer from "@/components/TripCheckins/LocationViewer";
import FeedbackViewer from "@/components/TripCheckins/FeedbackViewer";
import StoryActionModal from "@/components/TripCheckins/StoryActionModal";
import { PaginationSelect } from "@/components/ui/pagination-select";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

const STATUS_OPTIONS = [
    { value: "All", label: "All Status" },
    { value: "ENQUIRED", label: "Enquired" },
    { value: "SAVED", label: "Saved" },
    { value: "ON_GOING", label: "Ongoing" },
    { value: "ON_GOING_TEST", label: "Ongoing Test" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "SUCCESSFULL", label: "Successful" },
    { value: "UNSUCCESSFULL", label: "Unsuccessful" },
];

const STORY_OPTIONS = [
    { value: "All", label: "All Trip Stories" },
    { value: "With Story", label: "With Story" },
    { value: "Without Story", label: "Without Story" },
];

interface CheckinsTableProps {
    initialData: TripCheckin[];
    initialPagination: {
        total: number;
        page: number;
        limit: number;
    };
}

interface ColumnConfig {
    header: string;
    accessor?: keyof TripCheckin;
    minWidth?: string;
    render?: (item: TripCheckin) => React.ReactNode;
    align?: "left" | "center" | "right";
    className?: string;
}



export default function CheckinsTable({ initialData, initialPagination }: CheckinsTableProps) {
    const [data, setData] = useState<TripCheckin[]>(initialData);
    const [totalRecords, setTotalRecords] = useState(initialPagination.total);
    const [currentPage, setCurrentPage] = useState(initialPagination.page);
    const [rowsPerPage, setRowsPerPage] = useState(initialPagination.limit);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [storyFilter, setStoryFilter] = useState("All");
    const [mounted, setMounted] = useState(false);

    // Modal states
    const [locationViewerOpen, setLocationViewerOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ location: LocationCoordinates; title: string } | null>(null);
    const [feedbackViewerOpen, setFeedbackViewerOpen] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState<{ feedback: string; userName: string } | null>(null);
    const [storyActionOpen, setStoryActionOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<TripCheckin | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Expand Logic
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Filter Logic (client-side filtering for search only, status/story handled by server)
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch =
                item.firstName.toLowerCase().includes(search.toLowerCase()) ||
                item.lastName.toLowerCase().includes(search.toLowerCase()) ||
                (item.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
                item.source.toLowerCase().includes(search.toLowerCase()) ||
                item.destination.toLowerCase().includes(search.toLowerCase());

            // Status and Story filters are handled by the API (server-side)
            return matchesSearch;
        });
    }, [data, search]);

    // Server-side pagination
    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    const currentData = filteredData; // Display filtered data from current page

    // Helper to fetch data
    const fetchData = async (page: number, limit: number, status: string = statusFilter, story: string = storyFilter, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { getTripCheckinsPaginated } = await import("@/lib/api");
            // Pass current filters to the API
            const response = await getTripCheckinsPaginated(page, limit, status, story);
            setData(response.data);
            setTotalRecords(response.pagination.total);
            setCurrentPage(response.pagination.page);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            // Only refresh if no text search is active, filters are default ("All"),
            // and no modals are open.
            const isDefaultFilters = search === "" && statusFilter === "All" && storyFilter === "All";
            const noModalsOpen = !locationViewerOpen && !feedbackViewerOpen && !storyActionOpen;

            if (isDefaultFilters && noModalsOpen && !loading) {
                // Pass current state explicitly
                fetchData(currentPage, rowsPerPage, statusFilter, storyFilter, false);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [currentPage, rowsPerPage, search, statusFilter, storyFilter, locationViewerOpen, feedbackViewerOpen, storyActionOpen, loading]);

    // Initial Fetch & Filter Change Effect
    // When filters or page/row counts change, fetch new data.
    // Note: We debounce generic search, but filters usually trigger immediate fetch or via Apply button.
    // Assuming filters align with state immediately.
    useEffect(() => {
        fetchData(currentPage, rowsPerPage, statusFilter, storyFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, rowsPerPage, statusFilter, storyFilter]); // Re-fetch when any of these change

    // Pagination Handlers
    const handleNextPage = async () => {
        if (currentPage < totalPages && !loading) {
            await fetchData(currentPage + 1, rowsPerPage, statusFilter, storyFilter);
        }
    };

    const handlePrevPage = async () => {
        if (currentPage > 1 && !loading) {
            await fetchData(currentPage - 1, rowsPerPage, statusFilter, storyFilter);
        }
    };

    const handleRowsPerPageChange = async (newLimit: number) => {
        setRowsPerPage(newLimit); // Update state first
        await fetchData(1, newLimit, statusFilter, storyFilter);
    };

    // Handlers
    const handleViewLocation = (location: LocationCoordinates, title: string) => {
        setSelectedLocation({ location, title });
        setLocationViewerOpen(true);
    };

    const handleViewFeedback = (feedback: string, userName: string) => {
        setSelectedFeedback({ feedback, userName });
        setFeedbackViewerOpen(true);
    };

    const handleStoryAction = (trip: TripCheckin) => {
        setSelectedTrip(trip);
        setStoryActionOpen(true);
    };

    const handleSaveStory = (updated: TripCheckin) => {
        setData(prev => prev.map(item => item.id === updated.id ? updated : item));
    };

    const handleExport = async () => {
        try {
            const { downloadTripCheckins } = await import("@/lib/api");
            await downloadTripCheckins(statusFilter, storyFilter);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to download CSV. Please try again.");
        }
    };

    const truncateText = (text: string, maxLength: number = 80) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    // Helper functions for safe date formatting (avoid timezone shifts)
    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        // Use UTC methods to ensure we show the server date exactly as is
        return date.toLocaleDateString('en-GB', { timeZone: 'UTC' });
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        // Use UTC methods
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
    };

    // Columns Configuration
    const columns: ColumnConfig[] = useMemo(() => [
        {
            header: "Date",
            minWidth: "120px",
            render: (item) => (
                <span className="text-sm text-dark dark:text-white">
                    {item.dateTime ? formatDate(item.dateTime) : "-"}
                </span>
            )
        },
        {
            header: "Time",
            minWidth: "100px",
            render: (item) => (
                <span className="text-sm text-dark dark:text-white">
                    {item.dateTime ? formatTime(item.dateTime) : "-"}
                </span>
            )
        },
        {
            header: "Name",
            minWidth: "150px",
            render: (item) => (
                <span className="text-sm text-dark dark:text-white block" title={`${item.firstName} ${item.lastName}`}>
                    {item.firstName ? `${item.firstName} ${item.lastName || ""}` : "-"}
                </span>
            )
        },
        {
            header: "Email ID",
            minWidth: "200px",
            render: (item) => <span className="text-sm text-dark dark:text-white" title={item.email || ""}>{item.email || "-"}</span>
        },
        {
            header: "Mobile Number",
            minWidth: "130px",
            render: (item) => <span className="text-sm text-dark dark:text-white whitespace-nowrap">{item.mobileNumber || "-"}</span>
        },
        {
            header: "Source",
            minWidth: "250px",
            render: (item) => {
                const stopsCount = item.stops?.length || 0;

                const hasStops = stopsCount > 0;
                const isExpanded = expandedRows.has(item.id);

                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-dark dark:text-white">
                            {item.source ? item.source.split(',')[0] : "-"}
                        </span>
                        {hasStops && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRow(item.id);
                                }}
                                className={`h-5 w-5 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isExpanded ? "bg-gray-100 dark:bg-gray-700 text-primary" : "text-gray-500"}`}
                                title={`${stopsCount} stops`}
                            >
                                <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Destination",
            minWidth: "250px",
            render: (item) => (
                <span className="text-sm text-dark dark:text-white block" title={item.destination || ""}>
                    {item.destination || "-"}
                </span>
            )
        },
        {
            header: "Total km",
            minWidth: "120px",
            render: (item) => <span className="text-sm text-dark dark:text-white">{item.totalKm ? `${item.totalKm} km` : "-"}</span>
        },
        {
            header: "Station & Connector",
            minWidth: "150px",
            align: "center",
            render: (item) => {
                const text = item.stationConnectorCount || "";
                const match = text.match(/(\d+)\s*stations?,\s*(\d+)\s*connectors?/i);
                const stationCount = match ? match[1] : "0";
                const connectorCount = match ? match[2] : "0";

                return (
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-1.5" title={`${stationCount} Stations`}>
                            <span className="text-sm text-dark dark:text-white">
                                {stationCount}
                            </span>
                            <Fuel className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-1.5" title={`${connectorCount} Connectors`}>
                            <span className="text-sm text-dark dark:text-white">
                                {connectorCount}
                            </span>
                            <PlugZap className="h-4 w-4 text-orange-500" />
                        </div>
                    </div>
                );
            }
        },
        {
            header: "No of Charging Stops",
            minWidth: "180px",
            align: "center",
            render: (item) => <span className="text-sm text-dark dark:text-white block">{item.chargingStopsCount}</span>
        },
        {
            header: "EV Model",
            minWidth: "150px",
            render: (item) => <span className="text-sm text-dark dark:text-white block" title={item.evModel}>{item.evModel || "-"}</span>
        },
        {
            header: "EV Variant",
            minWidth: "130px",
            render: (item) => <span className="text-sm text-dark dark:text-white block" title={item.evVariant}>{item.evVariant || "-"}</span>
        },
        {
            header: "EV Battery Capacity",
            minWidth: "150px",
            render: (item) => <span className="text-sm text-dark dark:text-white whitespace-nowrap">{item.evBatteryCapacity || "-"}</span>
        },
        {
            header: "EVolts",
            minWidth: "80px",
            align: "center",
            render: (item) => <span className="text-sm text-dark dark:text-white">{item.evolts || "-"}</span>
        },
        {
            header: "Feedback",
            minWidth: "300px",
            render: (item) => item.feedback ? (
                <div className="flex items-center gap-2">
                    <p className="text-sm text-dark dark:text-white">
                        {truncateText(item.feedback)}
                    </p>
                    <button
                        onClick={() => handleViewFeedback(item.feedback!, `${item.firstName} ${item.lastName}`)}
                        className="text-primary hover:text-primary/80 whitespace-nowrap text-xs font-medium"
                    >
                        View
                    </button>
                </div>
            ) : <span className="text-sm text-gray-400">No feedback</span>
        },
        {
            header: "Status",
            minWidth: "120px",
            render: (item) => {
                const statusStyles: Record<string, string> = {
                    ENQUIRED: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
                    COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                    SAVED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                    ON_GOING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
                    ON_GOING_TEST: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                    SUCCESSFULL: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
                    UNSUCCESSFULL: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
                };

                const statusLabels: Record<string, string> = {
                    ENQUIRED: "Enquired",
                    COMPLETED: "Completed",
                    SAVED: "Saved",
                    ON_GOING: "Ongoing",
                    ON_GOING_TEST: "Ongoing Test",
                    CANCELLED: "Cancelled",
                    SUCCESSFULL: "Successful",
                    UNSUCCESSFULL: "Unsuccessful",
                };

                return (
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusStyles[item.tripStatus] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {statusLabels[item.tripStatus] || item.tripStatus}
                    </span>
                );
            }
        },
        {
            header: "Trip Completion Status",
            minWidth: "180px",
            render: (item) => item.tripCompletionStatus ? (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap
                        ${item.tripCompletionStatus === 'Successful' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                        item.tripCompletionStatus === 'Pending' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {item.tripCompletionStatus}
                </span>
            ) : <span className="text-sm text-gray-400">-</span>
        },
        {
            header: "Trip Story",
            minWidth: "100px",
            render: (item) => (
                <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap
                            ${item.hasTripStory === 'Yes' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {item.hasTripStory}
                    </span>
                </div>
            )
        },
        {
            header: "Action",
            minWidth: "120px",
            render: (item) => item.hasTripStory === "Yes" ? (
                <button
                    onClick={() => handleStoryAction(item)}
                    className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                    Manage Story
                </button>
            ) : <span className="text-sm text-gray-400">-</span>
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
            render: (item) => {
                let text = item.approvedBy || "";
                // Format [APPROVED_BY:Name] -> Approved by Name
                if (text.startsWith("[APPROVED_BY:") && text.endsWith("]")) {
                    const name = text.replace("[APPROVED_BY:", "").replace("]", "").trim();
                    text = `Approved by ${name}`;
                } else if (text.startsWith("[REJECTED_BY:") && text.endsWith("]")) {
                    const name = text.replace("[REJECTED_BY:", "").replace("]", "").trim();
                    text = `Rejected by ${name}`;
                }

                return text ? (
                    <span className="text-sm text-dark dark:text-white whitespace-nowrap block" title={text}>
                        {text}
                    </span>
                ) : <span className="text-sm text-gray-400">-</span>;
            }
        }
    ], [handleViewLocation, handleViewFeedback, handleStoryAction]);

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            {/* Header and Filters */}
            <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">
                    Trip Check-ins
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
                            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[260px]"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative col-span-1 w-full sm:w-auto">
                        <FilterDropdown
                            value={statusFilter}
                            options={STATUS_OPTIONS}
                            onChange={(val) => setStatusFilter(val)}
                            minWidth="100%"
                            className="w-full sm:w-[140px]"
                        />
                    </div>

                    {/* Story Filter */}
                    <div className="relative col-span-1 w-full sm:w-auto">
                        <FilterDropdown
                            value={storyFilter}
                            options={STORY_OPTIONS}
                            onChange={(val) => setStoryFilter(val)}
                            minWidth="100%"
                            className="w-full sm:w-[160px]"
                        />
                    </div>

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

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-t border-stroke bg-green-light-7 hover:bg-green-light-7 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-2">
                            {columns.map((col, idx) => (
                                <TableHead
                                    key={idx}
                                    className="px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap text-center"
                                    style={{ minWidth: col.minWidth }}
                                >
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((item) => (
                                <React.Fragment key={item.id}>
                                    <TableRow className={`border-t border-stroke dark:border-dark-3 ${expandedRows.has(item.id) ? "bg-gray-50 dark:bg-dark-2" : "odd:bg-white even:bg-gray-50/50 dark:odd:bg-transparent dark:even:bg-white/5"} hover:bg-gray-50 dark:hover:bg-white/5 transition-colors`}>
                                        {columns.map((col, idx) => (
                                            <TableCell key={idx} className="px-4 py-4 dark:border-dark-3 align-middle" align="center">
                                                <div className={`text-sm text-dark dark:text-white flex items-center justify-center ${col.className || ''}`}>
                                                    {col.render ? col.render(item) : (item[col.accessor as keyof TripCheckin] as React.ReactNode)}
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {expandedRows.has(item.id) && (
                                        <TableRow>
                                            {/* Spacer Cell to align content with Source column */}
                                            <TableCell colSpan={5} className="bg-gray-50 dark:bg-dark-2 p-0 border-b border-stroke dark:border-dark-3" />

                                            {/* Content Cell */}
                                            <TableCell colSpan={columns.length - 5} className="bg-gray-50 dark:bg-dark-2 p-0 border-b border-stroke dark:border-dark-3">
                                                <div className="p-4 dark:border-dark-3">
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex flex-col gap-2">
                                                            {(item.stops || []).map((s, i) => ({ ...s, name: `Stop ${i + 1}` })).map((stop: any, idx) => (
                                                                <div key={idx} className="flex items-center gap-1 text-sm">
                                                                    <span className="font-semibold text-primary w-14">{stop.name}</span>
                                                                    <span className="text-dark dark:text-white text-gray-600">{stop.address}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <p className="text-sm text-dark dark:text-white">
                                        No check-ins found.
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
                    {loading && (
                        <p className="hidden sm:block text-sm font-medium text-dark dark:text-white">Loading...</p>
                    )}
                    <p className="text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                        {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, totalRecords)} of {totalRecords}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-transparent text-dark hover:bg-gray-2 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || loading}
                            className="flex h-8 w-8 items-center justify-center rounded border border-stroke bg-transparent text-dark hover:bg-gray-2 disabled:opacity-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {mounted && selectedLocation && createPortal(
                <LocationViewer
                    isOpen={locationViewerOpen}
                    onClose={() => setLocationViewerOpen(false)}
                    location={selectedLocation.location}
                    title={selectedLocation.title}
                />,
                document.body
            )}

            {mounted && selectedFeedback && createPortal(
                <FeedbackViewer
                    isOpen={feedbackViewerOpen}
                    onClose={() => setFeedbackViewerOpen(false)}
                    feedback={selectedFeedback.feedback}
                    userName={selectedFeedback.userName}
                />,
                document.body
            )}

            {mounted && selectedTrip && createPortal(
                <StoryActionModal
                    isOpen={storyActionOpen}
                    onClose={() => setStoryActionOpen(false)}
                    trip={selectedTrip}
                    onSave={handleSaveStory}
                />,
                document.body
            )}
        </div>
    );
}

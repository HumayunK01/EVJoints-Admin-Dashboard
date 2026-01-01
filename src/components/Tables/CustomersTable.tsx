"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Filter, ArrowUpDown, ChevronDown, Download } from "lucide-react";
import { useState, useMemo, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { type Customer } from "@/lib/api";
import { DateRangeFilter } from "./DateRangeFilter";
import { PaginationSelect } from "@/components/ui/pagination-select";

const formatDate = (dateString: any): string => {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString('en-GB');
    } catch {
        return "-";
    }
};

const formatRegistrationNumber = (regNumber: any): string => {
    if (!regNumber) return "-";
    const str = String(regNumber).toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Standard Indian Format: MH 12 AB 1234
    // RegEx: 2 chars (State), 1-2 digits (District), 1-3 chars (Series, optional), 4 digits (Unique)
    const matchFull = str.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/);
    if (matchFull) {
        return `${matchFull[1]} ${matchFull[2]} ${matchFull[3]} ${matchFull[4]}`;
    }

    // Match without series: MH 12 1234
    const matchNoSeries = str.match(/^([A-Z]{2})(\d{1,2})(\d{4})$/);
    if (matchNoSeries) {
        return `${matchNoSeries[1]} ${matchNoSeries[2]} ${matchNoSeries[3]}`;
    }

    return str;
};

type ColumnConfig = {
    key: string;
    label: string;
    minWidth?: string;
    accessor?: (customer: Customer) => any;
    render?: (value: any, customer: Customer) => React.ReactNode;
    isExpandable?: boolean;
    formatValue?: (value: any) => string;
};

const COLUMNS: ColumnConfig[] = [
    { key: "firstName", label: "First Name", minWidth: "120px" },
    { key: "lastName", label: "Last Name", minWidth: "120px" },
    {
        key: "email",
        label: "Email ID",
        minWidth: "150px",
        render: (value) => (
            <p className="text-sm text-dark dark:text-white whitespace-nowrap text-center">
                {value || "-"}
            </p>
        )
    },
    { key: "phone", label: "Phone No", minWidth: "120px" },
    {
        key: "customerRegDate",
        label: "Customer Reg Date",
        minWidth: "150px",
        formatValue: formatDate
    },
    { key: "subscription", label: "Subscription", minWidth: "120px" },
    {
        key: "vehicleRegDate",
        label: "Vehicle Reg Date",
        minWidth: "150px",
        isExpandable: true,
        formatValue: formatDate
    },
    {
        key: "registrationNumber",
        label: "Registration Number",
        minWidth: "150px",
        isExpandable: true,
        formatValue: formatRegistrationNumber
    },
    { key: "vehicleType", label: "Vehicle Type", minWidth: "120px", isExpandable: true },
    { key: "manufacturer", label: "Manufacturer", minWidth: "120px", isExpandable: true },
    { key: "vehicleModel", label: "Vehicle Model", minWidth: "120px", isExpandable: true },
    { key: "vehicleVariant", label: "Vehicle Variant", minWidth: "120px", isExpandable: true },
    {
        key: "deviceBrand",
        label: "Device Brand",
        minWidth: "120px",
        render: (value) => (
            <p className="text-sm text-dark dark:text-white whitespace-nowrap text-center capitalize">
                {value || "-"}
            </p>
        )
    },
    {
        key: "deviceModel",
        label: "Device Model",
        minWidth: "120px",
        render: (value) => (
            <p className="text-sm text-dark dark:text-white whitespace-nowrap text-center capitalize">
                {value || "-"}
            </p>
        )
    },
    {
        key: "devicePlatform",
        label: "Device Platform",
        minWidth: "120px",
        render: (value) => (
            <p className="text-sm text-dark dark:text-white whitespace-nowrap text-center capitalize">
                {value || "-"}
            </p>
        )
    },
    {
        key: "appVersion",
        label: "App Version",
        minWidth: "100px",
        render: (value) => (
            <p className="text-sm text-dark dark:text-white whitespace-nowrap text-center">
                {value || "-"}
            </p>
        )
    },
    {
        key: "navigation",
        label: "Navigation",
        minWidth: "100px",
        render: (value) => (
            <div className="flex justify-center">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${value === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    {value || "No"}
                </span>
            </div>
        )
    },
    {
        key: "trip",
        label: "Trip",
        minWidth: "100px",
        render: (value) => (
            <div className="flex justify-center">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${value === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    {value || "No"}
                </span>
            </div>
        )
    },
    {
        key: "checkIn",
        label: "Check In",
        minWidth: "120px",
        render: (value) => (
            <div className="flex justify-center">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${value === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    {value || "No"}
                </span>
            </div>
        )
    },
];

const SORT_OPTIONS = [
    { label: "A - Z", value: "firstName-asc" },
    { label: "Z - A", value: "firstName-desc" },
    { label: "Newest First", value: "customerRegDate-desc" },
    { label: "Oldest First", value: "customerRegDate-asc" },
];

const ROWS_PER_PAGE_OPTIONS = [10, 15, 20, 50, 100];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface ExpandableCellProps {
    value: any;
    hasMultipleEntries: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    showExpandIcon: boolean;
    formatValue?: (value: any) => string;
}

const ExpandableCell = ({ value, hasMultipleEntries, isExpanded, onToggle, showExpandIcon, formatValue }: ExpandableCellProps) => {
    const displayValue = formatValue ? formatValue(value) : (value !== null && value !== undefined ? String(value) : "-");

    return (
        <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-dark dark:text-white whitespace-nowrap">{displayValue}</p>
            {hasMultipleEntries && showExpandIcon && (
                <button onClick={onToggle} className="text-dark dark:text-white hover:text-primary flex-shrink-0">
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            )}
        </div>
    );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getCellValue = (customer: Customer, column: ColumnConfig) => {
    return column.accessor ? column.accessor(customer) : (customer as any)[column.key];
};

const formatCellValue = (value: any, column: ColumnConfig) => {
    if (column.formatValue) return column.formatValue(value);
    return value;
};



// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CustomersTableProps {
    initialData: Customer[];
    initialPagination: {
        total: number;
        page: number;
        limit: number;
    };
}

export function CustomersTable({ initialData, initialPagination }: CustomersTableProps) {
    // State
    const [customers, setCustomers] = useState<Customer[]>(initialData);
    const [totalRecords, setTotalRecords] = useState(initialPagination.total);
    const [currentPage, setCurrentPage] = useState(initialPagination.page);
    const [rowsPerPage, setRowsPerPage] = useState(initialPagination.limit);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("customerRegDate-desc"); // Default: Newest First
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSortOpen, setIsSortOpen] = useState(false);

    // const [isDownloadOpen, setIsDownloadOpen] = useState(false); // Removed
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const showCheckboxes = searchTerm.length > 0 || startDate.length > 0 || endDate.length > 0;

    useEffect(() => {
        if (!showCheckboxes) setSelectedRows(new Set());
    }, [showCheckboxes]);

    // Server-side pagination - use data directly from backend
    const totalPages = Math.ceil(totalRecords / rowsPerPage);


    // Client-side filtering (search only - sorting is server-side)
    const filteredData = useMemo(() => {
        // 1. Deduplicate by ID (Safety check)
        const uniqueCustomers = Array.from(new Map(customers.map(item => [item.id, item])).values());

        let processedData = [...uniqueCustomers];

        // 2. Search Filtering (client-side for instant feedback)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            processedData = processedData.filter(customer =>
                (customer.firstName?.toLowerCase() || "").includes(lowerTerm) ||
                (customer.lastName?.toLowerCase() || "").includes(lowerTerm) ||
                (customer.email?.toLowerCase() || "").includes(lowerTerm) ||
                (customer.phone || "").includes(lowerTerm)
            );
        }

        return processedData;
    }, [customers, searchTerm]);

    const currentData = filteredData; // Display filtered data from current page


    // Helper to fetch data with server-side sorting and date filtering
    const fetchData = async (page: number, limit: number, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { getCustomersPaginated } = await import("@/lib/api");

            // Parse sortOption to get sortBy and order
            const [sortBy, order] = sortOption.split("-") as [string, "asc" | "desc"];

            // Fetch with server-side sorting and date filtering
            const response = await getCustomersPaginated(
                page,
                limit,
                sortBy,
                order,
                startDate || undefined,
                endDate || undefined
            );
            setCustomers(response.data);
            setTotalRecords(response.pagination.total);
            setCurrentPage(response.pagination.page);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!loading && !isSortOpen && !isFilterOpen) {
                fetchData(currentPage, rowsPerPage, false);
            }
        }, 30000); // Changed to 30 seconds
        return () => clearInterval(interval);
    }, [currentPage, rowsPerPage, loading, isSortOpen, isFilterOpen, sortOption, startDate, endDate]);

    // Re-fetch when sort option changes
    useEffect(() => {
        fetchData(currentPage, rowsPerPage);
    }, [sortOption]);

    // Re-fetch when date filters change
    useEffect(() => {
        // Reset to page 1 when filters change
        if (startDate || endDate) {
            fetchData(1, rowsPerPage);
        }
    }, [startDate, endDate]);

    // Handlers
    const handleNextPage = async () => {
        if (currentPage < totalPages && !loading) {
            await fetchData(currentPage + 1, rowsPerPage);
            setSelectedRows(new Set());
            setExpandedRows(new Set());
        }
    };

    const handlePrevPage = async () => {
        if (currentPage > 1 && !loading) {
            await fetchData(currentPage - 1, rowsPerPage);
            setSelectedRows(new Set());
            setExpandedRows(new Set());
        }
    };

    const handleRowsPerPageChange = async (newLimit: number) => {
        setRowsPerPage(newLimit); // Update state first
        await fetchData(1, newLimit);
        setSelectedRows(new Set());
        setExpandedRows(new Set());
    };

    const toggleRow = (identifier: number) => {
        const newSelected = new Set(selectedRows);
        newSelected.has(identifier) ? newSelected.delete(identifier) : newSelected.add(identifier);
        setSelectedRows(newSelected);
    };

    const toggleExpand = (identifier: number) => {
        const newExpanded = new Set(expandedRows);
        newExpanded.has(identifier) ? newExpanded.delete(identifier) : newExpanded.add(identifier);
        setExpandedRows(newExpanded);
    };

    const toggleAll = () => {
        setSelectedRows(selectedRows.size === currentData.length ? new Set() : new Set(currentData.map(c => c.id)));
    };

    const handleExport = async () => {
        try {
            const { downloadCustomers } = await import("@/lib/api");

            // Parse sortOption to get sortBy and order
            const [sortBy, order] = sortOption.split("-") as [string, "asc" | "desc"];

            await downloadCustomers(
                sortBy,
                order,
                startDate || undefined,
                endDate || undefined
            );
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to download CSV. Please try again.");
        }
    };

    // Render
    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            {/* Header */}
            <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">Customers List</h4>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-center sm:gap-2 sm:flex-wrap">
                    {/* Search */}
                    <div className="relative col-span-2 w-full sm:w-auto">
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-dark dark:text-white">
                            <Search className="h-4 w-4" />
                        </button>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[260px]"
                        />
                    </div>

                    <div className="contents sm:flex sm:items-center sm:gap-2">
                        {/* Filter */}
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="col-span-1 flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>

                        {/* Sort */}
                        <div className="col-span-1 w-full sm:w-auto">
                            <Dropdown isOpen={isSortOpen} setIsOpen={setIsSortOpen}>
                                <DropdownTrigger className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
                                    <ArrowUpDown className="h-4 w-4" />
                                    Sort
                                    <ChevronDown className="h-4 w-4" />
                                </DropdownTrigger>
                                <DropdownContent className="w-48 border border-stroke bg-white p-2 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
                                    {SORT_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                setSortOption(option.value);
                                                setIsSortOpen(false);
                                            }}
                                            className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2 ${sortOption === option.value ? "bg-gray-2 dark:bg-dark-2" : ""
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </DropdownContent>
                            </Dropdown>
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

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-t border-stroke bg-green-light-7 hover:bg-green-light-7 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-2">
                            {showCheckboxes && (
                                <TableHead className="w-[50px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                                        checked={currentData.length > 0 && selectedRows.size === currentData.length}
                                        onChange={toggleAll}
                                    />
                                </TableHead>
                            )}
                            {COLUMNS.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className="px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap text-center"
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((customer) => {
                                const isExpanded = expandedRows.has(customer.id);
                                const hasMultipleVehicles = !!(customer.vehicles && customer.vehicles.length > 1);

                                return (
                                    <Fragment key={customer.id}>
                                        <TableRow className="border-t border-stroke dark:border-dark-3">
                                            {showCheckboxes && (
                                                <TableCell className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                                                        checked={selectedRows.has(customer.id)}
                                                        onChange={() => toggleRow(customer.id)}
                                                    />
                                                </TableCell>
                                            )}
                                            {COLUMNS.map((column) => {
                                                const value = getCellValue(customer, column);
                                                const formattedValue = formatCellValue(value, column);

                                                return (
                                                    <TableCell key={column.key} className="px-4 py-4 dark:border-dark-3 text-center align-middle">
                                                        {column.isExpandable ? (
                                                            <ExpandableCell
                                                                value={value}
                                                                hasMultipleEntries={hasMultipleVehicles}
                                                                isExpanded={isExpanded}
                                                                onToggle={() => toggleExpand(customer.id)}
                                                                showExpandIcon={true}
                                                                formatValue={column.formatValue}
                                                            />
                                                        ) : column.render ? (
                                                            column.render(value, customer)
                                                        ) : (
                                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap text-center">
                                                                {formattedValue || "-"}
                                                            </p>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>

                                        {/* Expanded Rows for Additional Vehicles */}
                                        {isExpanded && customer.vehicles && customer.vehicles.slice(1).map((vehicle, vIdx) => (
                                            <TableRow
                                                key={`${customer.id}-v-${vIdx}`}
                                                className="border-t border-stroke bg-gray-50 dark:border-dark-3 dark:bg-white/5"
                                            >
                                                {showCheckboxes && <TableCell className="px-4 py-4"></TableCell>}
                                                {COLUMNS.map((column) => {
                                                    if (column.isExpandable && column.key in vehicle) {
                                                        const value = (vehicle as any)[column.key];
                                                        const formattedValue = column.formatValue ? column.formatValue(value) : value;
                                                        return (
                                                            <TableCell key={column.key} className="px-4 py-4 dark:border-dark-3 text-center align-middle">
                                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap text-center">
                                                                    {formattedValue || "-"}
                                                                </p>
                                                            </TableCell>
                                                        );
                                                    }
                                                    return <TableCell key={column.key} className="px-4 py-4"></TableCell>;
                                                })}
                                            </TableRow>
                                        ))}
                                    </Fragment>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={COLUMNS.length + (showCheckboxes ? 1 : 0)} className="h-24 text-center">
                                    <p className="text-sm text-dark dark:text-white">No customers found.</p>
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
                        options={ROWS_PER_PAGE_OPTIONS}
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
        </div>
    );
}

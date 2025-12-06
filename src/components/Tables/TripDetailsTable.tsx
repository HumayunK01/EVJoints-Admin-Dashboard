"use client";
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
    SortIcon,
    ChevronDownIcon,
} from "@/assets/icons";
import { DownloadIcon } from "./icons";
import { useState, useMemo, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
import {
    Dropdown,
    DropdownContent,
    DropdownTrigger,
} from "@/components/ui/dropdown";

import { type Trip } from "@/lib/api";
import { DateRangeFilter } from "./DateRangeFilter";

interface TripDetailsTableProps {
    trips: Trip[];
}

export function TripDetailsTable({ trips: initialData }: TripDetailsTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("Newest First");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);
    // Use the passed prop as the initial data
    const data = initialData;

    useEffect(() => {
        setMounted(true);
    }, []);

    const [tripStatusFilter, setTripStatusFilter] = useState("");

    const showCheckboxes = searchTerm.length > 0 || startDate.length > 0 || endDate.length > 0 || tripStatusFilter.length > 0;

    useEffect(() => {
        if (!showCheckboxes) {
            setSelectedRows(new Set());
        }
    }, [showCheckboxes]);

    const filteredData = useMemo(() => {
        return data.filter((trip) => {
            const matchesSearch = Object.values(trip).some((value) =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );

            const matchesDate =
                (!startDate || new Date(trip.dateTime) >= new Date(startDate)) &&
                (!endDate || new Date(trip.dateTime) <= new Date(endDate));

            const matchesStatus = !tripStatusFilter || trip.tripStatus === tripStatusFilter;

            return matchesSearch && matchesDate && matchesStatus;
        });
    }, [searchTerm, startDate, endDate, tripStatusFilter]);

    const sortedData = useMemo(() => {
        return [...filteredData].sort((a, b) => {
            switch (sortOption) {
                case "Ascending (Low High)":
                case "A - Z":
                    return a.firstName.localeCompare(b.firstName);
                case "Descending (High Low)":
                case "Z - A":
                    return b.firstName.localeCompare(a.firstName);
                case "Newest First":
                    return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
                case "Oldest First":
                    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
                default:
                    return 0;
            }
        });
    }, [filteredData, sortOption]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentData = sortedData.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const toggleRow = (id: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    const toggleAll = () => {
        if (selectedRows.size === currentData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(currentData.map((c) => c.id)));
        }
    };

    const handleDownload = (format: "csv" | "excel") => {
        if (data.length === 0) return;

        const headers = [
            "Customer Name",
            "Source",
            "Destination",
            "Date & Time",
            "Navigation",
            "Check - In",
            "Trip Status"
        ];

        // Determine which data to download: selected rows or all filtered data
        const dataToDownload = selectedRows.size > 0
            ? sortedData.filter(row => selectedRows.has(row.id))
            : sortedData;

        const rows = dataToDownload.map(trip => [
            `${trip.firstName} ${trip.lastName}`,
            trip.source,
            trip.destination,
            trip.dateTime,
            trip.navigation,
            trip.checkIn,
            trip.tripStatus
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `trip_details${selectedRows.size > 0 ? '_selected' : ''}.${format === "excel" ? "xls" : "csv"}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsDownloadOpen(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "On Going Test":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
            case "Saved":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "Enquired":
                return "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400";
        }
    };

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">
                    Trip Details
                </h4>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                    <div className="relative w-full sm:w-auto">
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-dark dark:text-white">
                            <SearchIcon className="h-4 w-4" />
                        </button>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[260px]"
                        />
                    </div>

                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                        >
                            <FilterIcon className="h-4 w-4" />
                            Filters
                        </button>

                        <Dropdown isOpen={isSortOpen} setIsOpen={setIsSortOpen}>
                            <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
                                <SortIcon className="h-4 w-4" />
                                Sort
                                <ChevronDownIcon className="h-4 w-4" />
                            </DropdownTrigger>
                            <DropdownContent className="w-48 border border-stroke bg-white p-2 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
                                {[
                                    "Ascending (Low High)",
                                    "Descending (High Low)",
                                    "A - Z",
                                    "Z - A",
                                    "Newest First",
                                    "Oldest First",
                                ].map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setSortOption(option);
                                            setIsSortOpen(false);
                                        }}
                                        className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2 ${sortOption === option
                                            ? "bg-gray-2 dark:bg-dark-2"
                                            : ""
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </DropdownContent>
                        </Dropdown>

                        <Dropdown isOpen={isDownloadOpen} setIsOpen={setIsDownloadOpen}>
                            <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
                                <DownloadIcon className="h-4 w-4" />
                                Download
                                <ChevronDownIcon className="h-4 w-4" />
                            </DropdownTrigger>
                            <DropdownContent className="w-40 border border-stroke bg-white p-2 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
                                <button
                                    onClick={() => handleDownload("csv")}
                                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2"
                                >
                                    CSV
                                </button>
                                <button
                                    onClick={() => handleDownload("excel")}
                                    className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2"
                                >
                                    Excel
                                </button>

                            </DropdownContent>
                        </Dropdown>
                    </div>
                </div>
            </div>

            {
                isFilterOpen && mounted && createPortal(
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
                                setTripStatusFilter("");
                            }}
                        >
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Trip Status
                                </label>
                                <select
                                    value={tripStatusFilter}
                                    onChange={(e) => setTripStatusFilter(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                                >
                                    <option value="">All Status</option>
                                    <option value="Enquired">Enquired</option>
                                    <option value="Saved">Saved</option>
                                    <option value="On Going Test">On Going Test</option>
                                </select>
                            </div>
                        </DateRangeFilter>
                    </div>,
                    document.body
                )
            }

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
                        <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Customer Name
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white">
                            Source
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white">
                            Destination
                        </TableHead>
                        <TableHead className="min-w-[180px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Date & Time
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Navigation
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Check - In
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Trip Status
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentData.length > 0 ? (
                        currentData.map((trip) => (
                            <TableRow
                                key={trip.id}
                                className="border-t border-stroke dark:border-dark-3"
                            >
                                {showCheckboxes && (
                                    <TableCell className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                                            checked={selectedRows.has(trip.id)}
                                            onChange={() => toggleRow(trip.id)}
                                        />
                                    </TableCell>
                                )}
                                <TableCell className="px-4 py-4 dark:border-dark-3">
                                    <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                        {trip.firstName} {trip.lastName}
                                    </p>
                                </TableCell>
                                <TableCell className="px-4 py-4 dark:border-dark-3">
                                    <p className="text-sm text-dark dark:text-white whitespace-normal break-words">
                                        {trip.source}
                                    </p>
                                </TableCell>
                                <TableCell className="px-4 py-4 dark:border-dark-3">
                                    <p className="text-sm text-dark dark:text-white whitespace-normal break-words">
                                        {trip.destination}
                                    </p>
                                </TableCell>
                                <TableCell className="px-4 py-4 dark:border-dark-3">
                                    <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                        {new Date(trip.dateTime).toLocaleString('en-GB')}
                                    </p>
                                </TableCell>
                                <TableCell className="px-4 py-4 dark:border-dark-3">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${trip.navigation === "Yes"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                    >
                                        {trip.navigation}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-4 dark:border-dark-3">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${trip.checkIn === "Yes"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                    >
                                        {trip.checkIn}
                                    </span>
                                </TableCell>
                                <TableCell className="px-4 py-4 dark:border-dark-3">
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(trip.tripStatus)}`}
                                    >
                                        {trip.tripStatus}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                <p className="text-sm text-dark dark:text-white">
                                    No trips found.
                                </p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

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
                        {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of{" "}
                        {sortedData.length}
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
        </div >
    );
}

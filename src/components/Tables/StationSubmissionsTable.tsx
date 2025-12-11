"use client";

import React, { useState, useMemo, useEffect } from "react";
import { StationSubmission, Connector } from "@/lib/api";
import { createPortal } from "react-dom";
import Link from "next/link";
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
import EditSubmissionModal from "@/components/StationSubmissions/EditSubmissionModal";
import ActionModal from "@/components/StationSubmissions/ActionModal";
import { DateRangeFilter } from "@/components/Tables/DateRangeFilter";


interface StationSubmissionsTableProps {
    submissions: StationSubmission[];
}

export default function StationSubmissionsTable({
    submissions: initialSubmissions,
}: StationSubmissionsTableProps) {
    const [data, setData] = useState<StationSubmission[]>(initialSubmissions);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [networkFilter, setNetworkFilter] = useState<string>("All");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Modals
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<StationSubmission | null>(null);
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject">("approve");

    useEffect(() => {
        setMounted(true);
    }, []);

    const networks = useMemo(() => Array.from(new Set(data.map((item) => item.networkName))), [data]);

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const matchesSearch =
                item.stationName.toLowerCase().includes(search.toLowerCase()) ||
                item.userName.toLowerCase().includes(search.toLowerCase()) ||
                item.networkName.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "All" || item.status === statusFilter;

            const matchesNetwork =
                networkFilter === "All" || item.networkName === networkFilter;

            const matchesDate =
                (!startDate || new Date(item.submissionDate) >= new Date(startDate)) &&
                (!endDate || new Date(item.submissionDate) <= new Date(endDate));

            return matchesSearch && matchesStatus && matchesNetwork && matchesDate;
        });
    }, [data, search, statusFilter, networkFilter, startDate, endDate]);

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

    // Actions
    const handleEditClick = (submission: StationSubmission) => {
        setSelectedSubmission(submission);
        setIsEditOpen(true);
    };

    const handleActionClick = (submission: StationSubmission, type: "approve" | "reject") => {
        setSelectedSubmission(submission);
        setActionType(type);
        setIsActionOpen(true);
    };

    const handleUpdateSubmission = (updatedItem: StationSubmission) => {
        setData((prev) =>
            prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );
    };

    const handleConfirmAction = (reason?: string) => {
        if (!selectedSubmission) return;

        let updatedEVolts = selectedSubmission.eVolts || 0;
        if (actionType === "approve") {
            updatedEVolts = (selectedSubmission.eVolts || 0) + 3;
        }

        const updated = {
            ...selectedSubmission,
            status: actionType === "approve" ? "Approved" : "Rejected",
            statusReason: reason,
            eVolts: updatedEVolts
        } as StationSubmission;

        handleUpdateSubmission(updated);
    };

    const handleExport = () => {
        const headers = [
            "ID",
            "Date",
            "Station Type",
            "Customer Name",
            "Phone No",
            "Latitude",
            "Longitude",
            "Network Name",
            "Station Name",
            "Connector Type",
            "Connectors",
            "Usage Type",
            "Photos",
            "Status",
            "EVolts"
        ];

        const rows = filteredData.map((item) => [
            item.id,
            item.submissionDate,
            item.stationType,
            item.userName,
            item.contactNumber,
            item.latitude,
            item.longitude,
            item.networkName,
            item.stationName,
            Array.from(new Set(item.connectors.map(c => c.type))).join('/'),
            item.connectors.map(c => `${c.count}x ${c.name}`).join(', '),
            item.usageType,
            item.photos.join(', '),
            item.status,
            item.eVolts
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
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm font-medium text-dark outline-none hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 pr-8"
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                        </div>

                        {/* Network Filter */}
                        <div className="relative">
                            <select
                                value={networkFilter}
                                onChange={(e) => setNetworkFilter(e.target.value)}
                                className="appearance-none rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm font-medium text-dark outline-none hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 pr-8"
                            >
                                <option value="All">All Networks</option>
                                {networks.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                        </div>

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
                            <TableHead className="min-w-[50px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                ID
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Date
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Station Type
                            </TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Customer Name
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Phone No
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Latitude
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Longitude
                            </TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Network Name
                            </TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Station Name
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Connector Type
                            </TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Connectors
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Usage Type
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Photos
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Status
                            </TableHead>
                            <TableHead className="min-w-[80px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                EVolts
                            </TableHead>
                            <TableHead className="px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="border-t border-stroke dark:border-dark-3"
                                >
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm font-medium text-dark dark:text-white">{item.id}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                            {new Date(item.submissionDate).toLocaleDateString()}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white">
                                            {item.stationType || "-"}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <Link href="#" className="text-sm text-primary hover:underline font-medium">
                                            {item.userName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white">{item.contactNumber}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white">{item.latitude}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white">{item.longitude}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white font-medium">
                                            {item.networkName}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white">{item.stationName}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white">
                                            {Array.from(new Set(item.connectors.map(c => c.type))).join('/')}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <div className="flex flex-col gap-1">
                                            {item.connectors.map((c, i) => (
                                                <div key={i} className="text-xs text-dark dark:text-white">
                                                    <span className="font-semibold">{c.count}x</span> {c.name}
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${item.usageType === 'Public' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {item.usageType}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm text-dark dark:text-white">
                                            {item.photos?.length || 0}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
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
                                        {item.status === 'Rejected' && item.statusReason && (
                                            <p className="mt-1 text-xs text-red-500 max-w-[120px] truncate" title={item.statusReason}>
                                                {item.statusReason}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <p className="text-sm font-bold text-dark dark:text-white text-center">
                                            {item.status === "Approved" ? item.eVolts : 0}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="text-dark hover:text-primary dark:text-white"
                                                title="Edit"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            {item.status === "Pending" && (
                                                <>
                                                    <button
                                                        onClick={() => handleActionClick(item, "approve")}
                                                        className="text-green-600 hover:text-green-700 dark:text-green-400"
                                                        title="Approve"
                                                    >
                                                        <CheckIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleActionClick(item, "reject")}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                                                        title="Reject"
                                                    >
                                                        <XIcon className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={16} className="h-24 text-center">
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

            <EditSubmissionModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                submission={selectedSubmission}
                onSave={handleUpdateSubmission}
            />

            <ActionModal
                isOpen={isActionOpen}
                onClose={() => setIsActionOpen(false)}
                type={actionType}
                onConfirm={handleConfirmAction}
            />
        </div>
    );
}

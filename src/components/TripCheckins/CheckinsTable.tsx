"use client";

import React, { useState, useMemo } from "react";
import { TripCheckin, approveCheckin, rejectCheckin, editCheckin } from "@/lib/api";

import NextLink from "next/link";
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
import CheckinDetailModal from "@/components/TripCheckins/CheckinDetailModal";
import CheckinEditDrawer from "@/components/TripCheckins/CheckinEditDrawer";

// --- Types ---
interface CheckinsTableProps {
    initialData: TripCheckin[];
}

export default function CheckinsTable({ initialData }: CheckinsTableProps) {
    const [data, setData] = useState<TripCheckin[]>(initialData);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);


    // Modals
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [selectedCheckin, setSelectedCheckin] = useState<TripCheckin | null>(null);

    // Filter Logic
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch =
                item.firstName.toLowerCase().includes(search.toLowerCase()) ||
                item.lastName.toLowerCase().includes(search.toLowerCase()) ||
                item.source.toLowerCase().includes(search.toLowerCase()) ||
                item.destination.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === "All" || item.tripStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [data, search, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);


    // Optional Columns Visibility Logic
    const hasEvData = currentData.some(d => d.ev);
    const hasRating = currentData.some(d => d.rating != null);
    const hasCharging = currentData.some(d => d.charging_time || d.units_charged);

    // EVolts Computation
    const computeEVolts = (item: TripCheckin) => {
        let score = 0;
        if (item.rating || item.feedback_provided) score += 2;
        if (item.story_status === "Approved" && item.blog_link) score += 3;
        return score;
    };

    // Handler wrappers
    const handleSaveEdit = (updated: TripCheckin) => {
        // Update local state
        setData(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const openDetail = (item: TripCheckin) => {
        setSelectedCheckin(item);
        setDetailModalOpen(true);
    };

    const openEdit = (item: TripCheckin) => {
        setSelectedCheckin(item);
        setEditDrawerOpen(true);
    };

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            {/* Header and Filters */}
            <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">
                    Trip Check-ins
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
                            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[260px]"
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
                                <option value="On Going Test">On Going</option>
                                <option value="Saved">Saved</option>
                                <option value="Enquired">Enquired</option>
                                <option value="Completed">Completed</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-t border-stroke bg-green-light-7 hover:bg-green-light-7 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-2">
                            <TableHead className="min-w-[80px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">ID</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Date</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Time</TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">User Name</TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Phone</TableHead>
                            <TableHead className="min-w-[250px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Source</TableHead>
                            <TableHead className="min-w-[250px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Destination</TableHead>
                            {hasEvData && (
                                <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">EV</TableHead>
                            )}
                            {(hasCharging) && (
                                <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Charging</TableHead>
                            )}
                            <TableHead className="min-w-[80px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Nav</TableHead>
                            <TableHead className="min-w-[80px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Check-In</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Status</TableHead>

                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">EVolts</TableHead>
                            <TableHead className="px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((item) => {
                                const computed = computeEVolts(item);
                                const stored = item.evolts_earned;

                                return (
                                    <TableRow key={item.id} className="border-t border-stroke dark:border-dark-3">
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <button onClick={() => openDetail(item)} className="text-sm text-dark hover:text-primary font-medium dark:text-white">
                                                {item.id}
                                            </button>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className="text-sm text-dark dark:text-white">{new Date(item.dateTime).toLocaleDateString()}</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className="text-sm text-gray-500">{new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className="text-sm font-medium text-dark dark:text-white">
                                                {item.firstName} {item.lastName}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {item.user_phone || "N/A"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className="text-sm text-dark dark:text-white whitespace-normal break-words">{item.source}</span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className="text-sm text-dark dark:text-white whitespace-normal break-words">{item.destination}</span>
                                        </TableCell>
                                        {hasEvData && (
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <span className="text-sm text-dark dark:text-white">{item.ev ? `${item.ev.brand} ${item.ev.model}` : "-"}</span>
                                            </TableCell>
                                        )}

                                        {hasCharging && (
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <div className="flex flex-col text-xs text-dark dark:text-white">
                                                    {item.units_charged && <span>{item.units_charged} kWh</span>}
                                                    {item.amount && <span>₹{item.amount}</span>}
                                                </div>
                                            </TableCell>
                                        )}

                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.navigation === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                                                {item.navigation}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.checkIn === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                                                {item.checkIn}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap
                                                ${item.tripStatus === 'Saved' || item.tripStatus === 'Completed' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                    item.tripStatus === 'Rejected' ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                                                {item.tripStatus}
                                            </span>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-dark dark:text-white">
                                                    {stored ?? computed}
                                                </span>
                                                {stored !== null && computed !== stored && (
                                                    <span className="text-xs text-red-500" title={`Computed: ${computed}`}>
                                                        ({computed})
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openDetail(item)} title="View" className="text-dark hover:text-primary dark:text-white">
                                                    <PreviewIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => openEdit(item)} title="Edit" className="text-dark hover:text-primary dark:text-white">
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={15} className="h-24 text-center">
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
            <div className="flex items-center justify-end gap-4 border-t border-stroke px-4 py-4 dark:border-dark-3 sm:px-6">
                <div className="flex items-center gap-2">
                    <select
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="bg-transparent text-sm font-medium text-dark outline-none dark:text-white"
                    >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-dark dark:text-white">
                        {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredData.length)} of{" "}
                        {filteredData.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {selectedCheckin && (
                <CheckinDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    data={selectedCheckin}
                    onEdit={() => {
                        setDetailModalOpen(false);
                        openEdit(selectedCheckin);
                    }}
                />
            )}

            {selectedCheckin && (
                <CheckinEditDrawer
                    isOpen={editDrawerOpen}
                    onClose={() => setEditDrawerOpen(false)}
                    data={selectedCheckin}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
}

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
    ChevronLeftIcon,
    ChevronRightIcon,
    SearchIcon,
    ChevronDownIcon,
} from "@/assets/icons";
import { PreviewIcon } from "@/components/Tables/icons";
import LocationViewer from "@/components/TripCheckins/LocationViewer";
import FeedbackViewer from "@/components/TripCheckins/FeedbackViewer";
import StoryActionModal from "@/components/TripCheckins/StoryActionModal";

interface CheckinsTableProps {
    initialData: TripCheckin[];
}

export default function CheckinsTable({ initialData }: CheckinsTableProps) {
    const [data, setData] = useState<TripCheckin[]>(initialData);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
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

    // Filter Logic
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesSearch =
                item.firstName.toLowerCase().includes(search.toLowerCase()) ||
                item.lastName.toLowerCase().includes(search.toLowerCase()) ||
                item.email.toLowerCase().includes(search.toLowerCase()) ||
                item.source.address.toLowerCase().includes(search.toLowerCase()) ||
                item.destination.address.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === "All" || item.tripStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [data, search, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + rowsPerPage);

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

    const truncateText = (text: string, maxLength: number = 80) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
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

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none rounded-lg border border-stroke bg-transparent px-3 py-2 text-sm font-medium text-dark outline-none hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2 pr-8"
                        >
                            <option value="All">All Status</option>
                            <option value="Planned">Planned</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-t border-stroke bg-green-light-7 hover:bg-green-light-7 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-2">
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Date</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Time</TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Name</TableHead>
                            <TableHead className="min-w-[200px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Email ID</TableHead>
                            <TableHead className="min-w-[130px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Mobile Number</TableHead>
                            <TableHead className="min-w-[250px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Source</TableHead>
                            <TableHead className="min-w-[250px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Stop 1</TableHead>
                            <TableHead className="min-w-[250px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Stop 2</TableHead>
                            <TableHead className="min-w-[250px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Stop 3</TableHead>
                            <TableHead className="min-w-[250px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Destination</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Total km</TableHead>
                            <TableHead className="min-w-[180px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Station & Connector Count</TableHead>
                            <TableHead className="min-w-[180px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Number of Charging Stops</TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">EV Model</TableHead>
                            <TableHead className="min-w-[130px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">EV Variant</TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">EV Battery Capacity</TableHead>
                            <TableHead className="min-w-[80px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">EVolts</TableHead>
                            <TableHead className="min-w-[300px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Feedback</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Navigation</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Check-in</TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Status</TableHead>
                            <TableHead className="min-w-[180px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Trip Completion Status</TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Trip Story</TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Action</TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Approval Date</TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Approved by</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((item) => (
                                <TableRow key={item.id} className="border-t border-stroke dark:border-dark-3">
                                    {/* Date */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm font-medium text-dark dark:text-white">
                                            {new Date(item.dateTime).toLocaleDateString()}
                                        </span>
                                    </TableCell>

                                    {/* Time */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </TableCell>

                                    {/* Name */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm font-medium text-dark dark:text-white">
                                            {item.firstName} {item.lastName}
                                        </span>
                                    </TableCell>

                                    {/* Email */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm text-dark dark:text-white">
                                            {item.email}
                                        </span>
                                    </TableCell>

                                    {/* Mobile Number */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm text-dark dark:text-white whitespace-nowrap">
                                            {item.mobileNumber}
                                        </span>
                                    </TableCell>

                                    {/* Source */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-dark dark:text-white truncate max-w-[200px]">
                                                {item.source.address.split(',')[0]}
                                            </span>
                                            <button
                                                onClick={() => handleViewLocation(item.source, "Source Location")}
                                                className="text-primary hover:text-primary/80 whitespace-nowrap text-xs font-medium"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </TableCell>

                                    {/* Stop 1 */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.stop1 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-dark dark:text-white truncate max-w-[200px]">
                                                    {item.stop1.address.split(',')[0]}
                                                </span>
                                                <button
                                                    onClick={() => handleViewLocation(item.stop1!, "Stop 1")}
                                                    className="text-primary hover:text-primary/80 whitespace-nowrap text-xs font-medium"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    {/* Stop 2 */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.stop2 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-dark dark:text-white truncate max-w-[200px]">
                                                    {item.stop2.address.split(',')[0]}
                                                </span>
                                                <button
                                                    onClick={() => handleViewLocation(item.stop2!, "Stop 2")}
                                                    className="text-primary hover:text-primary/80 whitespace-nowrap text-xs font-medium"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    {/* Stop 3 */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.stop3 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-dark dark:text-white truncate max-w-[200px]">
                                                    {item.stop3.address.split(',')[0]}
                                                </span>
                                                <button
                                                    onClick={() => handleViewLocation(item.stop3!, "Stop 3")}
                                                    className="text-primary hover:text-primary/80 whitespace-nowrap text-xs font-medium"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    {/* Destination */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-dark dark:text-white truncate max-w-[200px]">
                                                {item.destination.address.split(',')[0]}
                                            </span>
                                            <button
                                                onClick={() => handleViewLocation(item.destination, "Destination")}
                                                className="text-primary hover:text-primary/80 whitespace-nowrap text-xs font-medium"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </TableCell>

                                    {/* Total km */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm font-medium text-dark dark:text-white">
                                            {item.totalKm} km
                                        </span>
                                    </TableCell>

                                    {/* Station & Connector Count */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm text-dark dark:text-white">
                                            {item.stationConnectorCount}
                                        </span>
                                    </TableCell>

                                    {/* Number of Charging Stops */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm font-medium text-dark dark:text-white text-center block">
                                            {item.chargingStopsCount}
                                        </span>
                                    </TableCell>

                                    {/* EV Model */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm text-dark dark:text-white">
                                            {item.evModel}
                                        </span>
                                    </TableCell>

                                    {/* EV Variant */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm text-dark dark:text-white">
                                            {item.evVariant}
                                        </span>
                                    </TableCell>

                                    {/* EV Battery Capacity */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm font-medium text-dark dark:text-white">
                                            {item.evBatteryCapacity}
                                        </span>
                                    </TableCell>

                                    {/* EVolts */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className="text-sm font-bold text-dark dark:text-white text-center block">
                                            {item.evolts}
                                        </span>
                                    </TableCell>

                                    {/* Feedback */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.feedback ? (
                                            <div className="flex items-start gap-2">
                                                <p className="text-sm text-dark dark:text-white line-clamp-2">
                                                    {truncateText(item.feedback)}
                                                </p>
                                                <button
                                                    onClick={() => handleViewFeedback(item.feedback!, `${item.firstName} ${item.lastName}`)}
                                                    className="text-primary hover:text-primary/80 whitespace-nowrap text-xs font-medium"
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">No feedback</span>
                                        )}
                                    </TableCell>

                                    {/* Navigation */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.navigation === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                                            {item.navigation}
                                        </span>
                                    </TableCell>

                                    {/* Check-in */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${item.checkIn === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                                            {item.checkIn}
                                        </span>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap
                                            ${item.tripStatus === 'Completed' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                item.tripStatus === 'Cancelled' ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                                    item.tripStatus === 'Ongoing' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                                                        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                                            {item.tripStatus}
                                        </span>
                                    </TableCell>

                                    {/* Trip Completion Status */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.tripCompletionStatus ? (
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap
                                                ${item.tripCompletionStatus === 'Successful' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                {item.tripCompletionStatus}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    {/* Trip Story */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        <div className="flex flex-col gap-1">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium w-fit
                                                ${item.hasTripStory === 'Yes' ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                                                {item.hasTripStory}
                                            </span>
                                            {item.hasTripStory === "Yes" && item.storyStatus && (
                                                <span className={`text-xs font-medium
                                                    ${item.storyStatus === 'Approved' ? "text-green-600" :
                                                        item.storyStatus === 'Rejected' ? "text-red-600" :
                                                            "text-yellow-600"}`}>
                                                    ({item.storyStatus})
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Action */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.hasTripStory === "Yes" ? (
                                            <button
                                                onClick={() => handleStoryAction(item)}
                                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
                                            >
                                                Manage Story
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    {/* Approval Date */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.approvalDate ? (
                                            <span className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {new Date(item.approvalDate).toLocaleDateString()}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>

                                    {/* Approved by */}
                                    <TableCell className="px-4 py-4 dark:border-dark-3">
                                        {item.approvedBy ? (
                                            <span className="text-sm font-medium text-dark dark:text-white">
                                                {item.approvedBy}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={26} className="h-24 text-center">
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

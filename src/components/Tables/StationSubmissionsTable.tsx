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

interface StationSubmissionsTableProps {
    submissions: StationSubmission[];
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
    const [stationName, setStationName] = useState("");
    const [stationNumber, setStationNumber] = useState("");
    const [networkName, setNetworkName] = useState("");
    const [usageType, setUsageType] = useState<"Public" | "Private">("Public");
    const [stationType, setStationType] = useState("");
    const [operationalHours, setOperationalHours] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [selectedConnectorIdx, setSelectedConnectorIdx] = useState<number>(0);
    const [connectors, setConnectors] = useState<Connector[]>([]);

    useEffect(() => {
        if (station) {
            setStationName(station.stationName);
            setStationNumber(station.stationNumber || "");
            setNetworkName(station.networkName);
            setUsageType(station.usageType);
            setStationType(station.stationType);
            setOperationalHours(station.operationalHours || "");
            setLatitude(station.latitude.toString());
            setLongitude(station.longitude.toString());
            setContactNumber(station.contactNumber);
            setConnectors(JSON.parse(JSON.stringify(station.connectors))); // Deep copy
        }
    }, [station]);

    if (!isOpen || !station) return null;

    const handleConnectorChange = (field: keyof Connector, value: string) => {
        const updated = [...connectors];
        if (field === 'count') {
            updated[selectedConnectorIdx] = { ...updated[selectedConnectorIdx], [field]: parseInt(value) || 0 };
        } else {
            updated[selectedConnectorIdx] = { ...updated[selectedConnectorIdx], [field]: value };
        }
        setConnectors(updated);
    };

    const handleSave = () => {
        const updated: StationSubmission = {
            ...station,
            stationName,
            stationNumber,
            networkName,
            usageType,
            stationType,
            operationalHours,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            contactNumber,
            connectors,
        };

        onSave(updated);
        onClose();
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
                    {/* Station Information Section */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white uppercase tracking-wide">
                            Station Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Station Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={stationName}
                                    onChange={(e) => setStationName(e.target.value)}
                                    placeholder="Enter station name"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Station Number
                                </label>
                                <input
                                    type="text"
                                    value={stationNumber}
                                    onChange={(e) => setStationNumber(e.target.value)}
                                    placeholder="e.g., GPCS-001"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Network Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={networkName}
                                    onChange={(e) => setNetworkName(e.target.value)}
                                    placeholder="e.g., Tata Power"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Station Type
                                </label>
                                <input
                                    type="text"
                                    value={stationType}
                                    onChange={(e) => setStationType(e.target.value)}
                                    placeholder="e.g., Mall, Highway, Residential"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Usage Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={usageType}
                                    onChange={(e) => setUsageType(e.target.value as "Public" | "Private")}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                >
                                    <option value="Public">Public</option>
                                    <option value="Private">Private</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Operational Hours
                                </label>
                                <input
                                    type="text"
                                    value={operationalHours}
                                    onChange={(e) => setOperationalHours(e.target.value)}
                                    placeholder="e.g., 24/7 or 9 AM - 6 PM"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location & Contact Section */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white uppercase tracking-wide">
                            Location & Contact
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Latitude <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    placeholder="e.g., 28.556"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Longitude <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    placeholder="e.g., 77.09"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Contact Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    placeholder="+91XXXXXXXXXX"
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Connector Configuration Section */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-dark dark:text-white uppercase tracking-wide">
                            Connector Configuration
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Select Connector to Edit
                                </label>
                                <select
                                    value={selectedConnectorIdx}
                                    onChange={(e) => setSelectedConnectorIdx(Number(e.target.value))}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                                >
                                    {connectors.map((conn, idx) => (
                                        <option key={idx} value={idx}>
                                            Connector {idx + 1}: {conn.name} ({conn.type}) - {conn.count}x
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {connectors[selectedConnectorIdx] && (
                                <div className="rounded-lg border border-stroke p-4 dark:border-dark-3 bg-gray-50 dark:bg-dark-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                                Connector Name
                                            </label>
                                            <input
                                                type="text"
                                                value={connectors[selectedConnectorIdx].name}
                                                onChange={(e) => handleConnectorChange('name', e.target.value)}
                                                placeholder="e.g., CCS 2, Type 2"
                                                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                                Count
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={connectors[selectedConnectorIdx].count}
                                                onChange={(e) => handleConnectorChange('count', e.target.value)}
                                                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                                Type
                                            </label>
                                            <select
                                                value={connectors[selectedConnectorIdx].type}
                                                onChange={(e) => handleConnectorChange('type', e.target.value)}
                                                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                            >
                                                <option value="AC">AC</option>
                                                <option value="DC">DC</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                                Power Rating
                                            </label>
                                            <input
                                                type="text"
                                                value={connectors[selectedConnectorIdx].powerRating || ""}
                                                onChange={(e) => handleConnectorChange('powerRating', e.target.value)}
                                                placeholder="e.g., 50 kW, 7.4 kW"
                                                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                                Tariff
                                            </label>
                                            <input
                                                type="text"
                                                value={connectors[selectedConnectorIdx].tariff || ""}
                                                onChange={(e) => handleConnectorChange('tariff', e.target.value)}
                                                placeholder="e.g., ₹18/kWh, ₹12/kWh"
                                                className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-stroke dark:border-dark-3">
                        <button
                            onClick={handleSave}
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

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [networkFilter, setNetworkFilter] = useState<string>("All");
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
            "Station Number",
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
                            <TableHead className="min-w-[60px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                ID
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Date
                            </TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Customer Name
                            </TableHead>
                            <TableHead className="min-w-[130px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Customer Phone
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Latitude
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Longitude
                            </TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Network Name
                            </TableHead>
                            <TableHead className="min-w-[180px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Station Name
                            </TableHead>
                            <TableHead className="min-w-[130px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Station Number
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Connector Type
                            </TableHead>
                            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Connectors
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Power Rating
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Tariff
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Usage Type
                            </TableHead>
                            <TableHead className="min-w-[140px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Operational Hr
                            </TableHead>
                            <TableHead className="min-w-[80px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Photo
                            </TableHead>
                            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Status
                            </TableHead>
                            <TableHead className="min-w-[80px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                EVolt
                            </TableHead>
                            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Approval Date
                            </TableHead>
                            <TableHead className="px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {currentData.length > 0 ? (
                            currentData.map((item) => {
                                const isExpanded = expandedRows.has(item.id);
                                const hasMultipleConnectors = item.connectors.length > 1;

                                return (
                                    <React.Fragment key={item.id}>
                                        {/* Main Row */}
                                        <TableRow className="border-t border-stroke dark:border-dark-3">
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm font-medium text-dark dark:text-white">
                                                    {item.id}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                    {new Date(item.submissionDate).toLocaleDateString()}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-primary font-medium">
                                                    {item.userName}
                                                </p>
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
                                                <p className="text-sm text-dark dark:text-white">{item.stationNumber || "-"}</p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-dark dark:text-white">
                                                        {hasMultipleConnectors && !isExpanded
                                                            ? Array.from(new Set(item.connectors.map(c => c.type))).join('/')
                                                            : item.connectors[0].type}
                                                    </p>
                                                    {hasMultipleConnectors && (
                                                        <button
                                                            onClick={() => toggleExpand(item.id)}
                                                            className="text-primary hover:text-primary/80"
                                                        >
                                                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm text-dark dark:text-white">
                                                        {hasMultipleConnectors && !isExpanded ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                {item.connectors.map((c, idx) => (
                                                                    <div key={idx}>
                                                                        {c.count}x {c.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            `${item.connectors[0].count}x ${item.connectors[0].name}`
                                                        )}
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
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white">
                                                    {hasMultipleConnectors && !isExpanded
                                                        ? "Multiple"
                                                        : item.connectors[0].powerRating || "-"}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm text-dark dark:text-white">
                                                        {hasMultipleConnectors && !isExpanded ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                {item.connectors.map((c, idx) => (
                                                                    <div key={idx}>
                                                                        {c.tariff || "-"}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            item.connectors[0].tariff || "-"
                                                        )}
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
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${item.usageType === 'Public' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                    {item.usageType}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white">
                                                    {item.operationalHours || "-"}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                {item.photos.length > 0 ? (
                                                    <button
                                                        onClick={() => handlePhotoClick(item.photos, item.stationName)}
                                                        className="text-sm font-medium text-primary hover:underline"
                                                    >
                                                        {item.photos.length}
                                                    </button>
                                                ) : (
                                                    <p className="text-sm text-gray-500">0</p>
                                                )}
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
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm font-bold text-dark dark:text-white text-center">
                                                    {item.status === "Approved" ? item.eVolts : 0}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                    {item.approvalDate ? new Date(item.approvalDate).toLocaleDateString() : "-"}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <button
                                                    onClick={() => handleActionClick(item)}
                                                    className="text-dark hover:text-primary dark:text-white"
                                                    title="Edit"
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Connector Rows */}
                                        {isExpanded && hasMultipleConnectors && item.connectors.map((connector, idx) => (
                                            <TableRow key={`${item.id}-connector-${idx}`} className="border-t border-stroke bg-gray-50 dark:border-dark-3 dark:bg-dark-3">
                                                <TableCell colSpan={9} className="px-4 py-2"></TableCell>
                                                <TableCell className="px-4 py-2 dark:border-dark-3">
                                                    <p className="text-sm text-dark dark:text-white pl-6">
                                                        {connector.type}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="px-4 py-2 dark:border-dark-3">
                                                    <p className="text-sm text-dark dark:text-white pl-6">
                                                        {connector.count}x {connector.name}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="px-4 py-2 dark:border-dark-3">
                                                    <p className="text-sm text-dark dark:text-white">
                                                        {connector.powerRating || "-"}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="px-4 py-2 dark:border-dark-3">
                                                    <p className="text-sm text-dark dark:text-white">
                                                        {connector.tariff || "-"}
                                                    </p>
                                                </TableCell>
                                                <TableCell colSpan={7} className="px-4 py-2"></TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={20} className="h-24 text-center">
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

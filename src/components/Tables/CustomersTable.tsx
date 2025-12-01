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

import { type Customer } from "@/lib/api";
import { DateRangeFilter } from "./DateRangeFilter";

interface CustomersTableProps {
    customers: Customer[];
}

export function CustomersTable({ customers: initialData }: CustomersTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("Newest First");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterSubscription, setFilterSubscription] = useState("");
    const [filterVehicleType, setFilterVehicleType] = useState("");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);
    // Use the passed prop as the initial data
    const data = initialData;

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const showCheckboxes = searchTerm.length > 0 || startDate.length > 0 || endDate.length > 0;

    useEffect(() => {
        if (!showCheckboxes) {
            setSelectedRows(new Set());
        }
    }, [showCheckboxes]);

    const filteredData = useMemo(() => {
        return data.filter((customer) => {
            const matchesSearch = Object.values(customer).some((value) =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );

            const matchesDate =
                (!startDate || new Date(customer.customerRegDate) >= new Date(startDate)) &&
                (!endDate || new Date(customer.customerRegDate) <= new Date(endDate));

            const matchesSubscription = !filterSubscription || customer.subscription === filterSubscription;
            const matchesVehicleType = !filterVehicleType || customer.vehicleType === filterVehicleType;

            return matchesSearch && matchesDate && matchesSubscription && matchesVehicleType;
        });
    }, [searchTerm, startDate, endDate, filterSubscription, filterVehicleType]);

    // Extract unique options for filters
    const subscriptionOptions = useMemo(() => Array.from(new Set(data.map(c => c.subscription))), [data]);
    const vehicleTypeOptions = useMemo(() => Array.from(new Set(data.map(c => c.vehicleType))), [data]);

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
                    return new Date(b.customerRegDate).getTime() - new Date(a.customerRegDate).getTime();
                case "Oldest First":
                    return new Date(a.customerRegDate).getTime() - new Date(b.customerRegDate).getTime();
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

    const toggleRow = (email: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(email)) {
            newSelected.delete(email);
        } else {
            newSelected.add(email);
        }
        setSelectedRows(newSelected);
    };

    const toggleExpand = (email: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(email)) {
            newExpanded.delete(email);
        } else {
            newExpanded.add(email);
        }
        setExpandedRows(newExpanded);
    };

    const toggleAll = () => {
        if (selectedRows.size === currentData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(currentData.map((c) => c.email)));
        }
    };

    const handleDownload = (format: "csv" | "excel") => {
        if (data.length === 0) return;

        const headers = [
            "First Name",
            "Last Name",
            "Email",
            "Phone",
            "Vehicle Reg Date",
            "Customer Reg Date",
            "Vehicle Type",
            "Manufacturer",
            "Vehicle Model",
            "Vehicle Variant",
            "Device Brand",
            "Version",
            "Navigation",
            "Trip",
            "Check In",
            "Subscription",
            "Device Model",
            "Device Platform"
        ];

        // Determine which data to download: selected rows or all filtered data
        const dataToDownload = selectedRows.size > 0
            ? sortedData.filter(row => selectedRows.has(row.email))
            : sortedData;

        const rows = dataToDownload.flatMap(customer => {
            if (customer.vehicles && customer.vehicles.length > 0) {
                return customer.vehicles.map(vehicle => [
                    customer.firstName,
                    customer.lastName,
                    customer.email,
                    customer.phone,
                    vehicle.vehicleRegDate,
                    customer.customerRegDate,
                    vehicle.vehicleType,
                    vehicle.manufacturer,
                    vehicle.vehicleModel,
                    vehicle.vehicleVariant,
                    customer.deviceBrand,
                    customer.version,
                    customer.navigation,
                    customer.trip,
                    customer.checkIn,
                    customer.subscription,
                    customer.deviceModel,
                    customer.devicePlatform
                ]);
            } else {
                return [[
                    customer.firstName,
                    customer.lastName,
                    customer.email,
                    customer.phone,
                    customer.vehicleRegDate,
                    customer.customerRegDate,
                    customer.vehicleType,
                    customer.manufacturer,
                    customer.vehicleModel,
                    customer.vehicleVariant,
                    customer.deviceBrand,
                    customer.version,
                    customer.navigation,
                    customer.trip,
                    customer.checkIn,
                    customer.subscription,
                    customer.deviceModel,
                    customer.devicePlatform
                ]];
            }
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `customers_list${selectedRows.size > 0 ? '_selected' : ''}.${format === "excel" ? "xls" : "csv"}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsDownloadOpen(false);
    };

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-lg font-bold text-dark dark:text-white">
                    Customers List
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
                                setFilterSubscription("");
                                setFilterVehicleType("");
                            }}
                        >
                            <div className="flex gap-4 md:flex-row">
                                <div className="w-1/2 md:w-1/2">
                                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                        Subscription Type
                                    </label>
                                    <select
                                        value={filterSubscription}
                                        onChange={(e) => setFilterSubscription(e.target.value)}
                                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                                    >
                                        <option value="">All</option>
                                        {subscriptionOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-1/2 md:w-1/2">
                                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={filterVehicleType}
                                        onChange={(e) => setFilterVehicleType(e.target.value)}
                                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                                    >
                                        <option value="">All</option>
                                        {vehicleTypeOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </DateRangeFilter>
                    </div>,
                    document.body
                )
            }

            <Table>
                <TableHeader>
                    <TableRow className="border-t border-stroke bg-green-light-7 hover:bg-green-light-7 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-2">
                        <TableHead className="w-[20px] px-2 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            {/* Chevron Column */}
                        </TableHead>
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
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            First Name
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Last Name
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Email ID
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Phone No
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Vehicle Reg Date
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Customer Reg Date
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Vehicle Type
                        </TableHead>

                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Manufacturer
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Vehicle Model
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Vehicle Variant
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Device Brand
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Version
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Navigation
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Trip
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Check In
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Subscription
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Device Model
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                            Device Platform
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentData.length > 0 ? (
                        currentData.map((customer, key) => {
                            const isExpanded = expandedRows.has(customer.email);
                            const hasMultipleVehicles = customer.vehicles && customer.vehicles.length > 1;

                            return (
                                <Fragment key={customer.email}>
                                    <TableRow
                                        className="border-t border-stroke dark:border-dark-3"
                                    >
                                        <TableCell className="px-2 py-4">
                                            {hasMultipleVehicles && (
                                                <button
                                                    onClick={() => toggleExpand(customer.email)}
                                                    className="text-dark dark:text-white hover:text-primary"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDownIcon className="h-5 w-5 rotate-180" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            )}
                                        </TableCell>
                                        {showCheckboxes && (
                                            <TableCell className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                                                    checked={selectedRows.has(customer.email)}
                                                    onChange={() => toggleRow(customer.email)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.firstName}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.lastName}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.email}</p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.phone}</p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {new Date(customer.vehicleRegDate).toLocaleDateString('en-GB')}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {new Date(customer.customerRegDate).toLocaleDateString('en-GB')}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.vehicleType}
                                            </p>
                                        </TableCell>

                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.manufacturer}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.vehicleModel}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.vehicleVariant}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.deviceBrand}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.version}</p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.navigation === "Yes"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                            >
                                                {customer.navigation}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.trip === "Yes"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                            >
                                                {customer.trip}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.checkIn === "Yes"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}
                                            >
                                                {customer.checkIn}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.subscription}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.deviceModel}
                                            </p>
                                        </TableCell>
                                        <TableCell className="px-4 py-4 dark:border-dark-3">
                                            <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                {customer.devicePlatform}
                                            </p>
                                        </TableCell>
                                    </TableRow>

                                    {isExpanded && customer.vehicles && customer.vehicles.slice(1).map((vehicle, vIdx) => (
                                        <TableRow
                                            key={`${customer.email}-v-${vIdx}`}
                                            className="border-t border-stroke bg-gray-50 dark:border-dark-3 dark:bg-white/5"
                                        >
                                            <TableCell className="px-2 py-4"></TableCell>
                                            {showCheckboxes && <TableCell className="px-4 py-4"></TableCell>}
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                    {new Date(vehicle.vehicleRegDate).toLocaleDateString('en-GB')}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                    {vehicle.vehicleType}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                    {vehicle.manufacturer}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                    {vehicle.vehicleModel}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4 dark:border-dark-3">
                                                <p className="text-sm text-dark dark:text-white whitespace-nowrap">
                                                    {vehicle.vehicleVariant}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                            <TableCell className="px-4 py-4"></TableCell>
                                        </TableRow>
                                    ))}
                                </Fragment>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={20} className="h-24 text-center">
                                <p className="text-sm text-dark dark:text-white">
                                    No customers found.
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

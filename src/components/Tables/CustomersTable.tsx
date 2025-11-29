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
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    Dropdown,
    DropdownContent,
    DropdownTrigger,
} from "@/components/ui/dropdown";

import customersData from "@/data/customers.json";

export function CustomersTable() {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("Newest First");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredData = useMemo(() => {
        return customersData.filter((customer) => {
            const matchesSearch =
                customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDate =
                (!startDate || new Date(customer.customerRegDate) >= new Date(startDate)) &&
                (!endDate || new Date(customer.customerRegDate) <= new Date(endDate));

            return matchesSearch && matchesDate;
        });
    }, [searchTerm, startDate, endDate]);

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

    const handleDownload = (format: "csv" | "excel" | "pdf") => {
        if (format === "csv" || format === "excel") {
            const headers = Object.keys(customersData[0]).join(",");
            const csvContent = [
                headers,
                ...sortedData.map((row) => Object.values(row).join(",")),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `customers_list.${format === "excel" ? "xls" : "csv"}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("PDF download is not implemented yet.");
        }
        setIsDownloadOpen(false);
    };

    return (
        <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
            <div className="flex flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6 xl:px-7.5">
                <h4 className="text-xl font-bold text-dark dark:text-white">
                    Customers List
                </h4>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-dark dark:text-white">
                            <SearchIcon className="h-4 w-4" />
                        </button>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-10 pr-4 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[260px]"
                        />
                    </div>

                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                    >
                        <FilterIcon className="h-4 w-4" />
                        Filters
                    </button>

                    <Dropdown isOpen={isSortOpen} setIsOpen={setIsSortOpen}>
                        <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
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
                        <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2.5 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
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
                            <button
                                onClick={() => handleDownload("pdf")}
                                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2"
                            >
                                PDF
                            </button>
                        </DropdownContent>
                    </Dropdown>
                </div>
            </div>

            {isFilterOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-dark">
                        <div className="mb-4 flex items-center justify-between">
                            <h5 className="text-lg font-bold text-dark dark:text-white">
                                Filter Customers
                            </h5>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="text-dark hover:text-primary dark:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Registration Date From
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                                    Registration Date To
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                                />
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className="rounded-lg border border-stroke px-4 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <Table>
                <TableHeader>
                    <TableRow className="border-t border-stroke bg-green-light-7 dark:border-dark-3 dark:bg-dark-2">
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white xl:pl-11">
                            First Name
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Last Name
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                            Email ID
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Phone No
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                            Vehicle Reg Date
                        </TableHead>
                        <TableHead className="min-w-[150px] px-4 py-4 font-medium text-dark dark:text-white">
                            Customer Reg Date
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Vehicle Type
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Manufacturer
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Vehicle Model
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Vehicle Variant
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Device Brand
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 font-medium text-dark dark:text-white">
                            Version
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 font-medium text-dark dark:text-white">
                            Navigation
                        </TableHead>
                        <TableHead className="min-w-[100px] px-4 py-4 font-medium text-dark dark:text-white">
                            Trip
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Device Model
                        </TableHead>
                        <TableHead className="min-w-[120px] px-4 py-4 font-medium text-dark dark:text-white">
                            Device Platform
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentData.map((customer, key) => (
                        <TableRow
                            key={key}
                            className="border-t border-stroke dark:border-dark-3"
                        >
                            <TableCell className="px-4 py-5 pl-9 dark:border-dark-3 xl:pl-11">
                                <p className="font-medium text-dark dark:text-white">
                                    {customer.firstName}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="font-medium text-dark dark:text-white">
                                    {customer.lastName}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">{customer.email}</p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">{customer.phone}</p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.vehicleRegDate}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.customerRegDate}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.vehicleType}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.manufacturer}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.vehicleModel}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.vehicleVariant}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.deviceBrand}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">{customer.version}</p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.navigation}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">{customer.trip}</p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.deviceModel}
                                </p>
                            </TableCell>
                            <TableCell className="px-4 py-5 dark:border-dark-3">
                                <p className="text-dark dark:text-white">
                                    {customer.devicePlatform}
                                </p>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex items-center justify-end gap-4 border-t border-stroke px-4 py-4 dark:border-dark-3 sm:px-6">
                <div className="flex items-center gap-2">
                    <select
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        className="bg-transparent font-medium text-dark outline-none dark:text-white"
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
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";
import React, { useState, useMemo, useEffect, Fragment, useRef, useCallback } from "react";
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
import { createPortal } from "react-dom";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { DateRangeFilter } from "./DateRangeFilter";

/**
 * Upgrades:
 * - Debounced search
 * - AbortController to cancel stale requests
 * - Caching of page responses (per page+limit+params)
 * - Sends search/sort/startDate/endDate as query params (server-side filtering if supported)
 * - If page returns empty, automatically jump to last page and fetch it
 * - Keeps showing remaining items on last page (e.g. 7 items if total 17 and rowsPerPage=10)
 */

export function CustomersTable({ disableFetch = false }: { disableFetch?: boolean }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | "all">(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState("Newest First");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number | string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // backend data & meta
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // caching and abort
  const pageCache = useRef<Map<string, { fetched: any[]; total: number | null }>>(new Map());
  const currentController = useRef<AbortController | null>(null);

  useEffect(() => setMounted(true), []);

  const getKey = (c: any) => c?.__raw?.id ?? c?.email ?? c?.phone ?? `${c?.firstName}-${c?.lastName}`;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

  // Debounce search input (300ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Helper: build query string with optional params
  const buildUrl = (page: number, limit: number) => {
    const base = `${API_BASE.replace(/\/$/, "")}/api/customers`;
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sortOption) params.set("sort", sortOption);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return `${base}?${params.toString()}`;
  };

  // Helper: cache key uses page,limit and filter params so cached pages are parameterized
  const cacheKeyFor = (page: number, limit: number) =>
    `${page}_${limit}_${debouncedSearch}_${sortOption}_${startDate}_${endDate}`;

  // Helper: fetch page with limit (limit = number; page starting at 1)
  async function fetchPage(page: number, limit: number) {
    setLoading(true);
    setError(null);

    // use cache first
    const cacheKey = cacheKeyFor(page, limit);
    if (pageCache.current.has(cacheKey)) {
      const cached = pageCache.current.get(cacheKey)!;
      setLoading(false);
      return { fetched: cached.fetched, total: cached.total };
    }

    // Abort previous controller
    if (currentController.current) {
      try {
        currentController.current.abort();
      } catch {}
    }
    const controller = new AbortController();
    currentController.current = controller;

    try {
      const url = buildUrl(page, limit);
      const res = await fetch(url, { method: "GET", mode: "cors", signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = await res.json();
      const fetched = Array.isArray(json.data) ? json.data : [];
      const total = typeof json.total === "number" ? json.total : (json.total ? Number(json.total) : null);

      // cache it
      pageCache.current.set(cacheKey, { fetched, total: total ?? null });

      return { fetched, total };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // aborted: don't set global error
        return { fetched: [], total: null };
      }
      setError(err?.message ?? "Fetch error");
      return { fetched: [], total: null };
    } finally {
      setLoading(false);
    }
  }

  // Primary effect: fetch when currentPage or rowsPerPage or debounced params change
  useEffect(() => {
    if (disableFetch) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        if (rowsPerPage === "all") {
          // request a big limit so backend returns all rows (modify if you have >100k rows)
          const limit = 10000;
          const { fetched, total } = await fetchPage(1, limit);
          if (cancelled) return;
          setData(fetched);
          setTotalCount(total ?? fetched.length);
          setCurrentPage(1);
          setSelectedRows(new Set());
        } else {
          const limit = rowsPerPage as number;
          // ensure page is at least 1
          const pageToFetch = Math.max(1, currentPage);
          const { fetched, total } = await fetchPage(pageToFetch, limit);
          if (cancelled) return;

          // if backend returned nothing for requested page but total indicates there are items,
          // it usually means requested page is out of range -> jump to last page and fetch that
          const knownTotal = typeof total === "number" ? total : null;
          const computedTotalPages = knownTotal ? Math.max(1, Math.ceil(knownTotal / limit)) : null;

          if (fetched.length === 0 && computedTotalPages && pageToFetch > computedTotalPages) {
            // jump to last page and fetch again
            const lastPage = computedTotalPages;
            const { fetched: lastFetched, total: lastTotal } = await fetchPage(lastPage, limit);
            if (cancelled) return;
            setData(lastFetched);
            setTotalCount(lastTotal ?? (lastFetched.length + (lastPage - 1) * limit));
            setCurrentPage(lastPage);
            setSelectedRows(new Set());
          } else {
            // normal case
            setData(fetched);
            setTotalCount(total ?? fetched.length + (pageToFetch - 1) * limit); // if backend didn't provide total, estimate lower bound
            setSelectedRows(new Set());
          }
        }
      } catch (err: any) {
        // already handled in fetchPage
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      // abort ongoing fetch
      if (currentController.current) {
        try {
          currentController.current.abort();
        } catch {}
      }
    };
    // react to changes in currentPage or rowsPerPage or filters
  }, [currentPage, rowsPerPage, debouncedSearch, sortOption, startDate, endDate, disableFetch]); // eslint-disable-line

  // Ensure currentPage is valid when totalCount or rowsPerPage change
  useEffect(() => {
    if (rowsPerPage === "all") {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    const limit = rowsPerPage as number;
    const total = totalCount ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalCount, rowsPerPage]); // eslint-disable-line

  // Search/filter/sort are performed server-side (if backend supports) otherwise on page data
  const showCheckboxes = searchTerm.length > 0 || startDate.length > 0 || endDate.length > 0;

  useEffect(() => {
    if (!showCheckboxes) setSelectedRows(new Set());
  }, [showCheckboxes]);

  // If backend doesn't support server-side search, do client-side on the fetched page
  const filteredData = useMemo(() => {
    const lower = debouncedSearch.toLowerCase();
    return data.filter((customer) => {
      const vals = [
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.manufacturer,
        customer.vehicleModel,
      ].map((v) => String(v ?? "").toLowerCase());

      const matchesSearch = lower.length === 0 || vals.some((v) => v.includes(lower));
      const matchesDate =
        (!startDate || new Date(customer.customerRegDate) >= new Date(startDate)) &&
        (!endDate || new Date(customer.customerRegDate) <= new Date(endDate));
      return matchesSearch && matchesDate;
    });
  }, [data, debouncedSearch, startDate, endDate]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      switch (sortOption) {
        case "Ascending (Low High)":
        case "A - Z":
          return String(a.firstName ?? "").localeCompare(String(b.firstName ?? ""));
        case "Descending (High Low)":
        case "Z - A":
          return String(b.firstName ?? "").localeCompare(String(a.firstName ?? ""));
        case "Newest First":
          return new Date(b.customerRegDate).getTime() - new Date(a.customerRegDate).getTime();
        case "Oldest First":
          return new Date(a.customerRegDate).getTime() - new Date(b.customerRegDate).getTime();
        default:
          return 0;
      }
    });
  }, [filteredData, sortOption]);

  // Pagination UI: if rowsPerPage === "all", we display everything in a single page.
  const totalPages = rowsPerPage === "all" ? 1 : Math.max(1, Math.ceil((totalCount || sortedData.length) / (rowsPerPage as number)));
  const startIndex = rowsPerPage === "all" ? 0 : (currentPage - 1) * (rowsPerPage as number);
  const endIndex = rowsPerPage === "all" ? sortedData.length : startIndex + (rowsPerPage as number);
  const currentData = sortedData.slice(startIndex, endIndex);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  }, [currentPage]);

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "all" ? "all" : Number(e.target.value);
    setRowsPerPage(val);
    // If rowsPerPage is changed, set to page 1 (common UX). If you want to preserve a "relative" item position, compute new page accordingly.
    setCurrentPage(1);
    // clearing selected rows when page size changes
    setSelectedRows(new Set());
  };

  const toggleRow = (key: number | string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(key)) newSelected.delete(key);
    else newSelected.add(key);
    setSelectedRows(newSelected);
  };

  const toggleExpand = (key: number | string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(key)) newExpanded.delete(key);
    else newExpanded.add(key);
    setExpandedRows(newExpanded);
  };

  const toggleAll = () => {
    if (currentData.length === 0) {
      setSelectedRows(new Set());
      return;
    }
    const currentKeys = currentData.map((c) => getKey(c));
    const allSelected = currentKeys.every((k) => selectedRows.has(k));
    if (allSelected) setSelectedRows(new Set());
    else setSelectedRows(new Set(currentKeys));
  };

  const handleDownload = (format: "csv" | "excel") => {
    if (sortedData.length === 0) return;
    const headers = [
      "First Name","Last Name","Email","Phone","Customer Reg Date","Vehicle Reg Date","Subscription",
      "Vehicle Type","Manufacturer","Vehicle Model","Vehicle Variant","Device Brand","Device Model",
      "Device Platform","Version","Navigation","Trip","Check In"
    ];

    const dataToDownload = selectedRows.size > 0 ? sortedData.filter((r) => selectedRows.has(getKey(r))) : sortedData;

    const rows = dataToDownload.flatMap((customer) => {
      if (customer.vehicles && customer.vehicles.length > 0) {
        return customer.vehicles.map((vehicle: any) => [
          customer.firstName ?? "",
          customer.lastName ?? "",
          customer.email ?? "",
          customer.phone ?? "",
          customer.customerRegDate ?? "",
          vehicle.vehicleRegDate ?? "",
          customer.subscription ?? "",
          vehicle.vehicleType ?? customer.vehicleType ?? "",
          vehicle.manufacturer ?? customer.manufacturer ?? "",
          vehicle.vehicleModel ?? customer.vehicleModel ?? "",
          vehicle.vehicleVariant ?? customer.vehicleVariant ?? "",
          customer.deviceBrand ?? "",
          customer.deviceModel ?? "",
          customer.devicePlatform ?? "",
          customer.version ?? "",
          customer.navigation ?? "",
          String(customer.trip ?? ""),
          customer.checkIn ?? ""
        ]);
      }
      return [[
        customer.firstName ?? "", customer.lastName ?? "", customer.email ?? "", customer.phone ?? "",
        customer.customerRegDate ?? "", customer.vehicleRegDate ?? "", customer.subscription ?? "",
        customer.vehicleType ?? "", customer.manufacturer ?? "", customer.vehicleModel ?? "", customer.vehicleVariant ?? "",
        customer.deviceBrand ?? "", customer.deviceModel ?? "", customer.devicePlatform ?? "", customer.version ?? "",
        customer.navigation ?? "", String(customer.trip ?? ""), customer.checkIn ?? ""
      ]];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `customers_list${selectedRows.size > 0 ? "_selected" : ""}.${format === "excel" ? "xls" : "csv"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloadOpen(false);
  };

  return (
    <div className="max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-7.5">
        <h4 className="text-lg font-bold text-dark dark:text-white">Customers List</h4>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
          <div className="relative w-full sm:w-auto">
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-dark dark:text-white">
              <SearchIcon className="h-4 w-4" />
            </button>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary sm:w-[260px]" />
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
              <FilterIcon className="h-4 w-4" />
              Filters
            </button>

            <Dropdown isOpen={isSortOpen} setIsOpen={setIsSortOpen}>
              <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
                <SortIcon className="h-4 w-4" /> Sort <ChevronDownIcon className="h-4 w-4" />
              </DropdownTrigger>
              <DropdownContent className="w-48 border border-stroke bg-white p-2 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
                {["A - Z","Z - A","Newest First","Oldest First"].map(option => (
                  <button key={option} onClick={() => { setSortOption(option); setIsSortOpen(false); }}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2 ${sortOption === option ? "bg-gray-2 dark:bg-dark-2" : ""}`}>
                    {option}
                  </button>
                ))}
              </DropdownContent>
            </Dropdown>

            <Dropdown isOpen={isDownloadOpen} setIsOpen={setIsDownloadOpen}>
              <DropdownTrigger className="flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2">
                <DownloadIcon className="h-4 w-4" /> Download <ChevronDownIcon className="h-4 w-4" />
              </DropdownTrigger>
              <DropdownContent className="w-40 border border-stroke bg-white p-2 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
                <button onClick={() => handleDownload("csv")} className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2">CSV</button>
                <button onClick={() => handleDownload("excel")} className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-gray-2 dark:hover:bg-dark-2">Excel</button>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </div>

      {isFilterOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <DateRangeFilter startDate={startDate} endDate={endDate}
            onApply={(s,e) => { setStartDate(s); setEndDate(e); setIsFilterOpen(false); }}
            onCancel={() => setIsFilterOpen(false)}
            onClear={() => { setStartDate(""); setEndDate(""); }} />
        </div>, document.body)}

      <Table>
        <TableHeader>
          <TableRow className="border-t border-stroke bg-green-light-7 hover:bg-green-light-7 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-2">
            <TableHead className="w-[20px] px-2 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap"></TableHead>
            {showCheckboxes && (
              <TableHead className="w-[50px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">
                <input type="checkbox" className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                  checked={currentData.length > 0 && currentData.map(getKey).every(k => selectedRows.has(k))}
                  onChange={toggleAll} />
              </TableHead>
            )}
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">First Name</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Last Name</TableHead>
            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Email ID</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Phone No</TableHead>
            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Customer Reg Date</TableHead>
            <TableHead className="min-w-[150px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Vehicle Reg Date</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Subscription</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Vehicle Type</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Manufacturer</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Vehicle Model</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Vehicle Variant</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Device Brand</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Device Model</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Device Platform</TableHead>
            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Version</TableHead>
            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Navigation</TableHead>
            <TableHead className="min-w-[100px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Trip</TableHead>
            <TableHead className="min-w-[120px] px-4 py-4 text-sm font-medium text-dark dark:text-white whitespace-nowrap">Check In</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentData.length > 0 ? currentData.map((customer) => {
            const key = getKey(customer);
            const isExpanded = expandedRows.has(key);
            const hasMultipleVehicles = customer.vehicles && customer.vehicles.length > 1;
            return (
              <Fragment key={String(key)}>
                <TableRow className="border-t border-stroke dark:border-dark-3">
                  <TableCell className="px-2 py-4">
                    {hasMultipleVehicles && <button onClick={() => toggleExpand(key)} className="text-dark dark:text-white hover:text-primary">{isExpanded ? <ChevronDownIcon className="h-5 w-5 rotate-180" /> : <ChevronDownIcon className="h-5 w-5" />}</button>}
                  </TableCell>

                  {showCheckboxes && (
                    <TableCell className="px-4 py-4">
                      <input type="checkbox" className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3 dark:bg-dark-2"
                        checked={selectedRows.has(getKey(customer))} onChange={() => toggleRow(getKey(customer))} />
                    </TableCell>
                  )}

                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.firstName ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.lastName ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.email ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.phone ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.customerRegDate ? new Date(customer.customerRegDate).toLocaleDateString("en-GB") : "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.vehicleRegDate ? new Date(customer.vehicleRegDate).toLocaleDateString("en-GB") : "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.subscription ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.vehicleType ?? "-"}</p></TableCell>

                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.manufacturer ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.vehicleModel ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.vehicleVariant ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.deviceBrand ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.deviceModel ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.devicePlatform ?? "-"}</p></TableCell>
                  <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{customer.version ?? "-"}</p></TableCell>

                  <TableCell className="px-4 py-4 dark:border-dark-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.navigation === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {customer.navigation ?? "-"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-4 dark:border-dark-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${String(customer.trip) === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {String(customer.trip ?? "-")}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-4 dark:border-dark-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.checkIn === "Yes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                      {customer.checkIn ?? "-"}
                    </span>
                  </TableCell>
                </TableRow>

                {isExpanded && customer.vehicles && customer.vehicles.slice(1).map((vehicle: any, vIdx: number) => (
                  <TableRow key={`${String(key)}-v-${vIdx}`} className="border-t border-stroke bg-gray-50 dark:border-dark-3 dark:bg-white/5">
                    <TableCell className="px-2 py-4"></TableCell>
                    {showCheckboxes && <TableCell className="px-4 py-4"></TableCell>}
                    <TableCell className="px-4 py-4"></TableCell>
                    <TableCell className="px-4 py-4"></TableCell>
                    <TableCell className="px-4 py-4"></TableCell>
                    <TableCell className="px-4 py-4"></TableCell>
                    <TableCell className="px-4 py-4"></TableCell>
                    <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{vehicle.vehicleRegDate ? new Date(vehicle.vehicleRegDate).toLocaleDateString("en-GB") : "-"}</p></TableCell>
                    <TableCell className="px-4 py-4"></TableCell>
                    <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{vehicle.vehicleType ?? "-"}</p></TableCell>
                    <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{vehicle.manufacturer ?? "-"}</p></TableCell>
                    <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{vehicle.vehicleModel ?? "-"}</p></TableCell>
                    <TableCell className="px-4 py-4 dark:border-dark-3"><p className="text-sm text-dark dark:text-white whitespace-nowrap">{vehicle.vehicleVariant ?? "-"}</p></TableCell>
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
          }) : (
            <TableRow>
              <TableCell colSpan={20} className="h-24 text-center">
                <p className="text-sm text-dark dark:text-white">{loading ? "Loading..." : (error ? `Error: ${error}` : "No customers found.")}</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end gap-4 border-t border-stroke px-4 py-4 dark:border-dark-3 sm:px-6">
        <div className="flex items-center gap-2">
          <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="bg-transparent text-sm font-medium text-dark outline-none dark:text-white">
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-dark dark:text-white">
            {sortedData.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, sortedData.length)} of {rowsPerPage === "all" ? sortedData.length : (totalCount || sortedData.length)}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="flex h-8 w-8 items-center justify-center rounded text-dark hover:bg-gray-2 disabled:opacity-50 dark:text-white dark:hover:bg-dark-2">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

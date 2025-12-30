// ============================================================================
// IMPORTS
// ============================================================================

import customersData from "@/data/customers.json";
import stationSubmissionsData from "@/data/station-submissions.json";
import tripsData from "@/data/trips.json";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = "https://ev-backend-six.vercel.app/api";
const CACHE_POLICY = "no-store" as const;

// ============================================================================
// TYPE DEFINITIONS - SHARED
// ============================================================================

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
}

interface ApiResponse<T> {
    data: T;
    pagination?: PaginationInfo;
}

// ============================================================================
// TYPE DEFINITIONS - CUSTOMERS
// ============================================================================

export interface Customer {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
    vehicleRegDate: string;
    customerRegDate: string;
    registrationNumber: string | null;
    vehicleType: string;
    manufacturer: string;
    vehicleModel: string;
    vehicleVariant: string;
    deviceBrand: string | null;
    deviceModel: string | null;
    devicePlatform: string | null;
    appVersion: string | null;
    navigation: "Yes" | "No" | null;
    trip: "Yes" | "No" | null;
    checkIn: "Yes" | "No" | null;
    subscription: string;
    vehicles?: Vehicle[];
}

interface Vehicle {
    registrationNumber?: string;
    vehicleRegDate: string;
    vehicleType: string;
    manufacturer: string;
    vehicleModel: string;
    vehicleVariant: string;
}

export interface CustomersResponse {
    data: Customer[];
    pagination: PaginationInfo;
}

// ============================================================================
// TYPE DEFINITIONS - STATION SUBMISSIONS
// ============================================================================

// ================================
// Connector
// ================================
export interface Connector {
    name: string;
    count: number;
    type: string;               // AC | DC | "-"
    chargerTypeId?: number;     // Added for backend update
    powerRating?: string;
    tariff?: string;
}

// ================================
// Station Submission
// ================================
export interface StationSubmission {
    // Core identifiers
    id: number;
    stationName: string;
    stationNumber: string;

    // User / Owner
    userName: string | null;     // backend can return null
    userId?: string;             // optional (not always sent)
    addedByType?: "EV Owner" | "Station Owner" | "CPO";

    // Network / Usage
    networkName: string;
    networkId?: number;          // Added for backend update
    usageType: "Public" | "Private";
    stationType?: string;        // optional (Mall, Highway, etc.)

    // Location
    latitude: number;
    longitude: number;

    // Contact
    contactNumber: string | null;

    // Status / Dates
    status: "Pending" | "Approved" | "Rejected";
    submissionDate: string;      // ISO string from backend
    approvalDate?: string | null;
    operationalHours?: string;

    // Assets
    photos: string[];

    // Charging
    connectors: Connector[];     // empty array when none
    eVolts: number;

    // Optional backend additions
    statusReason?: string;       // if rejection reason added later
    reason?: string;             // Reason from backend response
}

// ============================================================================
// TYPE DEFINITIONS - TRIP CHECK-INS
// ============================================================================

// Stop interface matching backend structure (lat/lng instead of latitude/longitude)
export interface Stop {
    address: string;
    lat: number;
    lng: number;
}

// Keep LocationCoordinates for components that need latitude/longitude
export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    address: string;
}

export interface TripCheckin {
    id: number;                          // Changed from string to match backend
    dateTime: string;
    firstName: string;
    lastName: string;
    email: string | null;                // Made nullable to match backend
    mobileNumber: string;
    source: string;                      // Changed from LocationCoordinates to string
    stop1?: Stop | null;                 // Changed to Stop interface with lat/lng
    stop2?: Stop | null;
    stop3?: Stop | null;
    destination: string;                 // Changed from LocationCoordinates to string
    totalKm: number;
    stationConnectorCount: string;
    chargingStopsCount: number;
    evModel: string;
    evVariant: string;
    evBatteryCapacity: string;
    evolts: number;
    feedback?: string | null;
    navigation: "Yes" | "No";
    checkIn: "Yes" | "No";
    tripStatus: "ENQUIRED" | "COMPLETED"; // Changed to match backend enum values
    tripCompletionStatus?: string | null; // Made more flexible
    hasTripStory: "Yes" | "No";
    storyStatus?: string | null;          // Made more flexible
    blogLink?: string | null;             // Frontend-only field for story management
    approvalDate?: string | null;
    approvedBy?: string | null;
    // Legacy fields used by edit drawer
    rating?: number | null;
    rate_per_unit?: number | null;
    units_charged?: number | null;
    amount?: number | null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function fetchApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        cache: CACHE_POLICY,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function simulatePagination<T>(data: T[], page: number, limit: number): ApiResponse<T[]> & { pagination: PaginationInfo } {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        pagination: {
            total: data.length,
            page,
            limit,
        },
    };
}

// ============================================================================
// API FUNCTIONS - CUSTOMERS
// ============================================================================

export async function getCustomersPaginated(
    page: number = 1,
    limit: number = 10,
    sortBy: string = "customerRegDate",
    order: "asc" | "desc" = "desc"
): Promise<CustomersResponse> {
    try {
        const result = await fetchApi<CustomersResponse>(`/customers?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`);
        console.log(`✅ Fetched page ${page} from backend (sorted by ${sortBy} ${order})`);
        return result;
    } catch (error) {
        console.warn("⚠️ Backend unavailable, using fallback data");
        return simulatePagination(customersData as any as Customer[], page, limit);
    }
}

// ============================================================================
// API FUNCTIONS - STATION SUBMISSIONS
// ============================================================================

export interface StationSubmissionsResponse {
    data: StationSubmission[];
    pagination: PaginationInfo;
}

export async function getStationSubmissionsPaginated(
    page: number = 1,
    limit: number = 10
): Promise<StationSubmissionsResponse> {
    try {
        const result = await fetchApi<StationSubmissionsResponse>(`/stations?page=${page}&limit=${limit}`);
        console.log(`✅ Fetched stations page ${page} from backend`);
        return result;
    } catch (error) {
        console.warn("⚠️ Backend unavailable for stations, using fallback data");
        return simulatePagination(stationSubmissionsData as StationSubmission[], page, limit);
    }
}

// Unified update function based on new backend logic
export async function updateStation(
    id: number,
    data: Partial<StationSubmission>,
    action: "SAVE" | "APPROVE" | "REJECT"
): Promise<{ message: string }> {

    let payload: any = { action };

    // Handle specific actions
    if (action === "REJECT") {
        // Backend expects "reason" field for REJECT action
        payload.reason = data.statusReason;
    }

    // Only include detailed fields if action is SAVE
    if (action === "SAVE") {
        // 1. Parse operational hours
        let open_time = "00:00:00";
        let close_time = "23:59:00";
        const opHrs = data.operationalHours || "";

        if (opHrs && opHrs !== "-" && opHrs.includes("-")) {
            const parts = opHrs.split("-").map(s => s.trim());
            if (parts.length === 2) {
                open_time = parts[0];
                close_time = parts[1];
            }
        }

        // 2. Prepare payload
        payload = {
            ...payload,
            stationName: data.stationName,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            contactNumber: data.contactNumber,
            open_time,
            close_time,
            connectors: (data.connectors || []).map(c => ({
                chargerTypeId: c.chargerTypeId || 0,
                count: Number(c.count),
                // Strip non-numeric chars for power/tariff to be safe for parseFloat
                powerRating: String(c.powerRating || "").replace(/[^\d.]/g, ""),
                tariff: String(c.tariff || "").replace(/[^\d.]/g, "")
            }))
        };
    }

    const url = `${API_BASE_URL}/stations/${id}`;
    console.log(`[API] Station Action: ${action} to ${url}`, payload);

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to ${action} station: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Helper alias for status updates if needed
export async function updateStationStatus(
    id: number,
    status: "Approved" | "Rejected",
    reason?: string
): Promise<{ message: string }> {
    const action = status === "Approved" ? "APPROVE" : "REJECT";
    return updateStation(id, { statusReason: reason }, action);
}

// Legacy function for backward compatibility (deprecated)
export async function getStationSubmissions(): Promise<StationSubmission[]> {
    console.warn("⚠️ getStationSubmissions is deprecated, use getStationSubmissionsPaginated instead");
    return stationSubmissionsData as StationSubmission[];
}

// ============================================================================
// API FUNCTIONS - TRIP CHECK-INS
// ============================================================================

export interface TripCheckinsResponse {
    data: TripCheckin[];
    pagination: PaginationInfo;
}

export async function getTripCheckinsPaginated(
    page: number = 1,
    limit: number = 10
): Promise<TripCheckinsResponse> {
    try {
        const result = await fetchApi<TripCheckinsResponse>(`/trips?page=${page}&limit=${limit}`);
        console.log(`✅ Fetched trips page ${page} from backend`);
        return result;
    } catch (error) {
        console.warn("⚠️ Backend unavailable for trips, using fallback data");
        return simulatePagination(tripsData as TripCheckin[], page, limit);
    }
}

// Legacy function for backward compatibility (deprecated)
export async function getTripCheckins(): Promise<TripCheckin[]> {
    console.warn("⚠️ getTripCheckins is deprecated, use getTripCheckinsPaginated instead");
    return tripsData as TripCheckin[];
}

export async function getCheckinById(id: number): Promise<TripCheckin | undefined> {
    const checkins = await getTripCheckins();
    return checkins.find((checkin) => checkin.id === id);
}

export async function editCheckin(
    id: number,
    editedFields: Partial<TripCheckin>,
    editReason: string,
    admin: string
): Promise<boolean> {
    console.log(`[API] Editing checkin ${id}:`, { editedFields, editReason, admin });
    // TODO: Implement backend API call
    return true;
}

export async function approveCheckin(
    id: number,
    creditedEvolts: number,
    notifyWhatsapp: boolean,
    admin: string
): Promise<boolean> {
    console.log(`[API] Approving checkin ${id}:`, { creditedEvolts, notifyWhatsapp, admin });
    // TODO: Implement backend API call
    return true;
}

export async function rejectCheckin(
    id: number,
    reason: string,
    admin: string
): Promise<boolean> {
    console.log(`[API] Rejecting checkin ${id}:`, { reason, admin });
    // TODO: Implement backend API call
    return true;
}

export async function postAudit(entry: any): Promise<void> {
    console.log("[API] Audit log:", entry);
    // TODO: Implement backend API call
}

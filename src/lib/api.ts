// ============================================================================
// IMPORTS
// ============================================================================

import customersData from "@/data/customers.json";
import stationSubmissionsData from "@/data/station-submissions.json";
import tripsData from "@/data/trips.json";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Primary API - handles all authentication operations (login, register, OTP)
const PRIMARY_API_URL = process.env.NEXT_PUBLIC_PRIMARY_API_URL!;

// Secondary API - handles all data operations (customers, stations, trips)
// Use different URLs for server-side (SSR) vs client-side rendering
const getSecondaryApiUrl = () => {
    // Server-side rendering (Node.js environment)
    if (typeof window === "undefined") {
        return process.env.SECONDARY_API_URL_SERVER || process.env.NEXT_PUBLIC_SECONDARY_API_URL!;
    }
    // Client-side rendering (Browser environment)
    return process.env.NEXT_PUBLIC_SECONDARY_API_URL!;
};

const SECONDARY_API_URL = getSecondaryApiUrl();

const CACHE_POLICY = "no-store" as const;

// App Configuration
export const APP_CONFIG = {
    primaryApiUrl: PRIMARY_API_URL,
    secondaryApiUrl: SECONDARY_API_URL,
    appName: process.env.NEXT_PUBLIC_APP_NAME!,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION!,
    enableFallback: process.env.NEXT_PUBLIC_ENABLE_FALLBACK !== "false", // Default true
};

console.log("🔧 API Configuration:", {
    primaryApi: APP_CONFIG.primaryApiUrl,
    secondaryApi: APP_CONFIG.secondaryApiUrl,
    isServer: typeof window === "undefined",
    fallbackEnabled: APP_CONFIG.enableFallback
});

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
// TYPE DEFINITIONS - PRIMARY API (AUTHENTICATION)
// ============================================================================

export interface AuthResponse {
    success?: boolean;
    status?: number;
    message: string;
    token?: string;
    vendor_id?: number;
    user?: UserProfile;
    result?: {
        customer_id?: number;
        otp_id?: number;
        token?: string;
        user?: UserProfile;
    };
}

export interface UserProfile {
    id?: number;
    name: string;
    avatar?: string;
    email?: string;
    phone?: string;
    pan?: string;
    gst?: string;
    role?: string;
}

export interface VendorRegistrationData {
    name: string;
    date_of_birth: string;
    email: string;
    mobile: string;
    pan: string;
    gst_no: string;
    area: number;
    business_type: string;
    business_url: string;
    business_mobile: string;
    business_email: string;
}

export interface VendorDetails {
    id: number;
    name: string;
    email: string;
    mobile: string;
    date_of_birth?: string;
    pan?: string;
    gst_no?: string;
    area?: number;
    business_type?: string;
    business_url?: string;
    business_mobile?: string;
    business_email?: string;
    role?: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================================================
// TYPE DEFINITIONS - SECONDARY API (DATA)
// ============================================================================

// Customers
export interface Customer {
    id: number;
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

// Station Submissions
export interface Connector {
    name: string;
    count: number;
    type: string;
    chargerTypeId?: number;
    powerRating?: string;
    tariff?: string;
}

export interface ChargerType {
    id: number;
    name: string;
    type: string;
    defaultPower?: string;
}

export interface Network {
    id: number;
    name: string;
    status: number;
    liveStatus?: string;
    approvedStatus?: string;
}

export interface NetworksResponse {
    active: Network[];
    inactive: Network[];
}

export interface StationSubmission {
    // Core identifiers
    id: number;
    stationName: string;
    stationNumber: string;

    // User / Owner
    userName: string | null;
    userId?: string;
    addedByType?: string;

    // Network / Usage
    networkName: string;
    networkId?: number;
    networkStatus?: number;
    usageType: "Public" | "Private";
    stationType?: string;

    // Location
    latitude: number;
    longitude: number;

    // Contact
    contactNumber: string | null;

    // Status / Dates
    status: "Pending" | "Approved" | "Rejected";
    submissionDate: string;
    approvalDate?: string | null;
    operationalHours?: string;

    // Assets
    photos: string[];

    // Charging
    connectors: Connector[];
    eVolts: number;

    // Optional backend additions
    statusReason?: string;
    reason?: string;
}

export interface StationSubmissionsResponse {
    data: StationSubmission[];
    pagination: PaginationInfo;
}

// Trip Check-ins
export interface Stop {
    address: string;
    lat: number;
    lng: number;
}

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    address: string;
}

export interface TripCheckin {
    id: number;
    dateTime: string;
    firstName: string;
    lastName: string;
    email: string | null;
    mobileNumber: string;
    source: string;
    sourceLocation?: LocationCoordinates | null;
    stops?: Stop[];
    destination: string;
    destinationLocation?: LocationCoordinates | null;
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
    tripStatus: "SAVED" | "ON_GOING" | "CANCELLED" | "COMPLETED" | "ENQUIRED" | "SUCCESSFULL" | "ON_GOING_TEST" | "UNSUCCESSFULL";
    tripCompletionStatus?: string | null;
    hasTripStory: "Yes" | "No";
    storyStatus?: string | null;
    blogLink?: string | null;
    approvalDate?: string | null;
    approvedBy?: string | null;
    // Legacy fields used by edit drawer
    rating?: number | null;
    rate_per_unit?: number | null;
    units_charged?: number | null;
    amount?: number | null;
}

export interface TripCheckinsResponse {
    data: TripCheckin[];
    pagination: PaginationInfo;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getApiUrl(endpoint: string): string {
    // Use primary API for authentication endpoints
    if (endpoint.startsWith("/vendor") || endpoint.startsWith("/auth")) {
        return PRIMARY_API_URL;
    }

    // Use secondary API for data operations (customers, stations, trips)
    // Detect server-side vs client-side for each call
    if (typeof window === "undefined") {
        // Server-side rendering (SSR)
        return process.env.SECONDARY_API_URL_SERVER || process.env.NEXT_PUBLIC_SECONDARY_API_URL!;
    }

    // Client-side rendering
    return process.env.NEXT_PUBLIC_SECONDARY_API_URL!;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
    const baseUrl = getApiUrl(endpoint);
    const fullUrl = `${baseUrl}${endpoint}`;

    // Get token from cookies (client-side)
    let token = "";
    if (typeof document !== "undefined") {
        const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
        if (match) token = match[2];
    }

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    console.log(`[API] Fetching: ${fullUrl}`);

    try {
        const response = await fetch(fullUrl, {
            cache: CACHE_POLICY,
            headers: headers,
        });

        console.log(`[API] Response status: ${response.status} for ${fullUrl}`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error(`[API] Fetch failed for ${fullUrl}:`, error);
        throw error;
    }
}

async function postApi<T>(endpoint: string, data: any): Promise<T> {
    const baseUrl = getApiUrl(endpoint);
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch {
            errorData = { message: errorText };
        }

        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
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
// PRIMARY API FUNCTIONS (AUTHENTICATION)
// ============================================================================

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await postApi<AuthResponse>("/vendor/login", { email, password });
    return response;
}

export async function registerVendor(data: VendorRegistrationData): Promise<AuthResponse> {
    const response = await postApi<AuthResponse>("/vendor/register", data);
    return response;
}

export async function sendVendorOtp(mobile: string, email: string): Promise<AuthResponse> {
    const response = await postApi<AuthResponse>("/vendor/send-otp", { mobile, email });
    return response;
}

export async function verifyVendorOtp(mobile: string, vendor_id: number, otp: string): Promise<AuthResponse> {
    const response = await postApi<AuthResponse>("/vendor/verify-otp", { mobile, vendor_id, otp });
    return response;
}

export async function getVendorDetails(id: number): Promise<VendorDetails> {
    const response = await fetchApi<{ status: number; message: string; result: VendorDetails }>(`/vendor/details?id=${id}`);

    // Backend returns { status: 1, message: "...", result: { vendor details } }
    if (response.status === 1 && response.result) {
        return response.result;
    }

    throw new Error(response.message || "Failed to fetch vendor details");
}

// ============================================================================
// SECONDARY API FUNCTIONS (DATA OPERATIONS)
// ============================================================================

// Customers
export async function getCustomersPaginated(
    page: number = 1,
    limit: number = 10,
    sortBy: string = "customerRegDate",
    order: "asc" | "desc" = "desc",
    startDate?: string,
    endDate?: string
): Promise<CustomersResponse> {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            order,
        });

        if (startDate) {
            queryParams.append("startDate", startDate);
        }

        if (endDate) {
            queryParams.append("endDate", endDate);
        }

        const result = await fetchApi<CustomersResponse>(`/customers?${queryParams.toString()}`);
        console.log(`✅ Fetched page ${page} from backend (sorted by ${sortBy} ${order})`);
        return result;
    } catch (error) {
        console.warn("⚠️ Backend unavailable, using fallback data");
        return simulatePagination(customersData as any as Customer[], page, limit);
    }
}

// ============================================================================
// DOWNLOAD FUNCTIONS
// ============================================================================

/**
 * Helper function to trigger CSV download
 */
async function downloadCSV(endpoint: string, filename: string, queryParams: URLSearchParams): Promise<void> {
    try {
        const baseUrl = getApiUrl(endpoint);
        const fullUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;

        // Get token from cookies (client-side)
        let token = "";
        if (typeof document !== "undefined") {
            const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
            if (match) token = match[2];
        }

        const headers: HeadersInit = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        console.log(`[API] Downloading: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            cache: CACHE_POLICY,
            headers: headers,
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        // Get the blob and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ Download completed');
    } catch (error) {
        console.error("Download failed:", error);
        throw error;
    }
}

/**
 * Download customers as CSV
 */
export async function downloadCustomers(
    sortBy: string = "customerRegDate",
    order: "asc" | "desc" = "desc",
    startDate?: string,
    endDate?: string
): Promise<void> {
    const queryParams = new URLSearchParams({ sortBy, order });
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    await downloadCSV("/customers/download", "customers.csv", queryParams);
}

/**
 * Download station submissions as CSV
 */
export async function downloadStationSubmissions(
    status?: string,
    startDate?: string,
    endDate?: string,
    search?: string
): Promise<void> {
    const queryParams = new URLSearchParams();
    if (status && status !== "All") queryParams.append("status", status);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (search) queryParams.append("search", search);

    await downloadCSV("/stations/download", "station_submissions.csv", queryParams);
}

/**
 * Download trip check-ins as CSV
 */
export async function downloadTripCheckins(
    status: string = "All",
    story: string = "All"
): Promise<void> {
    const queryParams = new URLSearchParams();
    if (status && status !== "All") queryParams.append("status", status);
    if (story && story !== "All") queryParams.append("story", story);

    await downloadCSV("/trips/download", "trip_checkins.csv", queryParams);
}

/**
 * Download charging stations as CSV
 */
export async function downloadChargingStations(
    status?: string,
    usageType?: string,
    networkId?: string,
    addedBy?: string,
    chargerType?: string,
    stationType?: string,
    startDate?: string,
    endDate?: string,
    search?: string
): Promise<void> {
    const queryParams = new URLSearchParams();
    if (status && status !== "All") queryParams.append("status", status);
    if (usageType && usageType !== "All") queryParams.append("usageType", usageType);
    if (networkId && networkId !== "All") queryParams.append("networkId", networkId);
    if (addedBy && addedBy !== "All") queryParams.append("addedBy", addedBy);
    if (chargerType && chargerType !== "All") queryParams.append("chargerType", chargerType);
    if (stationType && stationType !== "All") queryParams.append("stationType", stationType);
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);
    if (search) queryParams.append("search", search);

    await downloadCSV("/charging-stations/download", "charging_stations.csv", queryParams);
}

// Networks


// Station Submissions
export async function getStationSubmissionsPaginated(
    page: number = 1,
    limit: number = 10,
    status?: string,
    startDate?: string,
    endDate?: string,
    search?: string
): Promise<StationSubmissionsResponse> {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status && status !== "All") {
            queryParams.append("status", status);
        }

        if (startDate) {
            queryParams.append("startDate", startDate);
        }

        if (endDate) {
            queryParams.append("endDate", endDate);
        }

        if (search) {
            queryParams.append("search", search);
        }

        const result = await fetchApi<StationSubmissionsResponse>(`/stations?${queryParams.toString()}`);
        console.log(`✅ Fetched stations page ${page} from backend`);
        return result;
    } catch (error) {
        console.warn("⚠️ Backend unavailable for stations, using fallback data");
        return simulatePagination(stationSubmissionsData as StationSubmission[], page, limit);
    }
}

export async function updateStation(
    id: number,
    data: Partial<StationSubmission>,
    action: "SAVE" | "APPROVE" | "REJECT"
): Promise<{ message: string }> {

    let payload: any = { action };

    if (action === "REJECT") {
        payload.reason = data.statusReason;
    }

    if (action === "SAVE") {
        let open_time = "00:00:00";
        let close_time = "23:59:00";
        const opHrs = data.operationalHours || "";

        // Manual time parser to avoid Date issues and safeguard against locale/browser inconsistencies
        const parseTime = (timeStr: string): string | null => {
            if (!timeStr) return null;
            // Matches: 9, 09, 9:30, 09:30, 9 AM, 9:30 PM, etc.
            const match = timeStr.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
            if (!match) return null;

            let [_, h, m, mer] = match;
            let hour = parseInt(h, 10);
            let minute = m ? parseInt(m, 10) : 0;

            if (mer) {
                mer = mer.toUpperCase();
                if (mer === "PM" && hour < 12) hour += 12;
                if (mer === "AM" && hour === 12) hour = 0;
            }

            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        };

        if (opHrs && opHrs.length > 3) {
            // Split by hyphen, en-dash, or em-dash
            const parts = opHrs.split(/[-–—]/).map(s => s.trim());
            if (parts.length === 2) {
                const start = parseTime(parts[0]);
                const end = parseTime(parts[1]);
                if (start) open_time = start;
                if (end) close_time = end;
                console.log(`[updateStation] Parsed: "${opHrs}" -> ${open_time} - ${close_time}`);
            }
        }

        payload = {
            ...payload,
            stationName: data.stationName,
            networkName: data.networkName,
            networkId: data.networkId ?? null,
            stationType: data.stationType,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            contactNumber: data.contactNumber,
            open_time,
            close_time,
            connectors: (data.connectors || []).map(c => ({
                chargerTypeId: c.chargerTypeId || 0,
                count: Number(c.count),
                powerRating: String(c.powerRating || "").replace(/[^\d.]/g, ""),
                tariff: String(c.tariff || "").replace(/[^\d.]/g, "")
            })),
            addedByType: data.addedByType,
            usageType: data.usageType
        };
    }

    const url = `${SECONDARY_API_URL}/stations/${id}`;

    console.log(`[updateStation] Sending PUT to ${url}`, payload);

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[updateStation] Backend Error: ${response.status} ${errText}`);
        throw new Error(`Failed to ${action} station: ${response.status} ${response.statusText} - ${errText}`);
    }

    return response.json();
}

export async function updateStationStatus(
    id: number,
    status: "Approved" | "Rejected",
    reason?: string
): Promise<{ message: string }> {
    const action = status === "Approved" ? "APPROVE" : "REJECT";
    return updateStation(id, { statusReason: reason }, action);
}

export async function getStationSubmissions(): Promise<StationSubmission[]> {
    console.warn("⚠️ getStationSubmissions is deprecated, use getStationSubmissionsPaginated instead");
    return stationSubmissionsData as StationSubmission[];
}

// Trip Check-ins
// Trip Check-ins
export async function getTripCheckinsPaginated(
    page: number = 1,
    limit: number = 10,
    status: string = "All",
    story: string = "All"
): Promise<TripCheckinsResponse> {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (status && status !== "All") {
            queryParams.append("status", status);
        }

        if (story && story !== "All") {
            queryParams.append("story", story);
        }

        const result = await fetchApi<TripCheckinsResponse>(`/trips?${queryParams.toString()}`);
        return result;
    } catch (error) {
        console.warn("⚠️ Backend unavailable for trips, using fallback data");
        // Note: Filter logic is not implemented in fallback simulation for now
        return simulatePagination(tripsData as TripCheckin[], page, limit);
    }
}

export async function updateTripStory(id: number, action: "Approved" | "Rejected", name: string, blogLink?: string): Promise<{ message: string }> {
    const endpoint = `/trips/story/${id}/`; // Trailing slash per backend snippet
    const baseUrl = getApiUrl(endpoint);

    // Get token
    let token = "";
    if (typeof document !== "undefined") {
        const match = document.cookie.match(new RegExp('(^| )auth_token=([^;]+)'));
        if (match) token = match[2];
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, name, blogLink }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update story: ${errorText}`);
    }

    return response.json();
}

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

export async function getChargerTypes(): Promise<ChargerType[]> {
    try {
        return await fetchApi<ChargerType[]>("/stations/charger-types");
    } catch (error) {
        console.warn("Using static charger types fallback");
        return [
            { id: 1, name: "CCS2", type: "DC", defaultPower: "60" },
            { id: 2, name: "Type 2", type: "AC", defaultPower: "22" },
            { id: 3, name: "CHAdeMO", type: "DC", defaultPower: "50" },
            { id: 4, name: "Bharat AC001", type: "AC", defaultPower: "3.3" },
            { id: 5, name: "Bharat DC001", type: "DC", defaultPower: "15" }
        ];
    }
}

export async function getNetworks(): Promise<NetworksResponse> {
    try {
        return await fetchApi<NetworksResponse>("/networks");
    } catch (error) {
        console.warn("Using fallback networks data");
        return {
            active: [
                { id: 1, name: "Tata Power", status: 1 },
                { id: 2, name: "Jio-bp", status: 1 },
                { id: 3, name: "Zeon Charging", status: 1 },
                { id: 4, name: "Statiq", status: 1 }
            ],
            inactive: []
        };
    }
}

export async function deleteNetwork(id: number): Promise<{ message: string }> {
    const url = `${SECONDARY_API_URL}/networks/${id}`;

    // For delete, we might not use fetchApi wrapper if we want specific response handling
    // But consistent usage is better. fetchApi handles json parsing.

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to delete network: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

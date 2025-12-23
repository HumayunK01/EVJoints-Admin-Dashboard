import customersData from "@/data/customers.json";
import stationSubmissionsData from "@/data/station-submissions.json";

export interface Customer {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vehicleRegDate: string;
    customerRegDate: string;
    registration_number?: string; // Added field
    vehicleType: string;
    manufacturer: string;
    vehicleModel: string;
    vehicleVariant: string;
    deviceBrand: string;
    version: string;
    navigation: string;
    trip: string;
    checkIn: string;
    subscription: string;
    deviceModel: string;
    devicePlatform: string;
    vehicles?: {
        registration_number?: string; // Added field
        vehicleRegDate: string;
        vehicleType: string;
        manufacturer: string;
        vehicleModel: string;
        vehicleVariant: string;
    }[];
}

export async function getCustomers(): Promise<Customer[]> {
    // --- REAL BACKEND INTEGRATION ---
    // When the backend is ready, uncomment this block and remove 'return customersData;'

    /*
    try {
        // Replace with your actual backend URL
        const response = await fetch('http://localhost:3001/api/customers', {
            cache: 'no-store' // Ensure fresh data on every request
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch customers');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching customers:', error);
        return []; // Return empty array on error to prevent app crash
    }
    */

    return customersData;
}

// Trip data is now handled by TripCheckin interface and getTripCheckins() function below
// The old Trip interface had incorrect types (source/destination as strings instead of LocationCoordinates)
import tripsData from "@/data/trips.json";

export interface Connector {
    name: string;
    count: number;
    type: "AC" | "DC";
    powerRating?: string; // e.g., "7.4 kW", "50 kW"
    tariff?: string; // e.g., "₹15/kWh"
}

export interface StationSubmission {
    id: number;
    submissionDate: string;
    stationName: string;
    stationNumber?: string; // Station identification number
    userName: string;
    userId: string;
    networkName: string;
    usageType: "Public" | "Private";
    connectors: Connector[];
    photos: string[];
    status: "Pending" | "Approved" | "Rejected";
    statusReason?: string;
    contactNumber: string;
    latitude: number;
    longitude: number;
    stationType: string;
    eVolts: number;
    operationalHours?: string; // e.g., "24/7" or "9 AM - 6 PM"
    approvalDate?: string; // Date when station was approved
    addedByType?: "EV Owner" | "Station Owner" | "CPO"; // Who added this station
}

export async function getStationSubmissions(): Promise<StationSubmission[]> {
    return stationSubmissionsData as StationSubmission[];
}


// --- Trip Check-ins API ---

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    address: string;
}

export interface TripCheckin {
    id: string;
    dateTime: string; // When user planned the trip
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;

    // Route details with coordinates
    source: LocationCoordinates;
    stop1?: LocationCoordinates | null;
    stop2?: LocationCoordinates | null;
    stop3?: LocationCoordinates | null;
    destination: LocationCoordinates;

    // Trip metrics
    totalKm: number;
    stationConnectorCount: string; // e.g., "5 stations, 12 connectors"
    chargingStopsCount: number; // Number suggested by system

    // EV Details
    evModel: string;
    evVariant: string;
    evBatteryCapacity: string; // e.g., "40 kWh"

    // Engagement
    evolts: number;
    feedback?: string | null;
    navigation: "Yes" | "No";
    checkIn: "Yes" | "No";

    // Status
    tripStatus: "Planned" | "Ongoing" | "Completed" | "Cancelled";
    tripCompletionStatus?: "Successful" | "Failed" | null;

    // Trip Story
    hasTripStory: "Yes" | "No";
    storyStatus?: "Pending" | "Approved" | "Rejected" | null;
    blogLink?: string | null;

    // Approval tracking
    approvalDate?: string | null;
    approvedBy?: string | null;

    // Legacy fields for backward compatibility
    user_phone?: string | null;
    ev?: {
        brand: string;
        model: string;
        variant: string;
    } | null;
    rating?: number | null;
    feedback_provided?: boolean | null;
    charging_time?: string | null;
    connector?: string | null;
    rate_per_unit?: number | null;
    units_charged?: number | null;
    amount?: number | null;
    evolts_earned?: number | null;
    photos?: { url: string; filename: string }[];
    audit_log?: {
        action: string;
        admin?: string | null;
        timestamp: string;
        notes: string;
    }[];
    flags?: {
        duplicate?: boolean;
        amount_mismatch?: boolean;
    };
    story_opt_in?: boolean | null;
}

export async function getTripCheckins(): Promise<TripCheckin[]> {
    // Return the comprehensive trip data with all new fields
    return tripsData as TripCheckin[];
}

export async function getCheckinById(id: string): Promise<TripCheckin | undefined> {
    const list = await getTripCheckins();
    return list.find(t => t.id === id);
}

export async function editCheckin(id: string, editedFields: Partial<TripCheckin>, editReason: string, admin: string) {
    console.log(`[Mock API] Editing checkin ${id}:`, editedFields, "Reason:", editReason, "Admin:", admin);
    // In a real app, updated backend here
    return true;
}

export async function approveCheckin(id: string, creditedEvolts: number, notifyWhatsapp: boolean, admin: string) {
    console.log(`[Mock API] Approving checkin ${id} with ${creditedEvolts} EVolts. Notify: ${notifyWhatsapp}, Admin: ${admin}`);
    return true;
}

export async function rejectCheckin(id: string, reason: string, admin: string) {
    console.log(`[Mock API] Rejecting checkin ${id}. Reason: ${reason}, Admin: ${admin}`);
    return true;
}

export async function postAudit(entry: any) {
    console.log(`[Mock API] Audit Log:`, entry);
}

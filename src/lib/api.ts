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

import tripsData from "@/data/trips.json";

export interface Trip {
    id: string;
    firstName: string;
    lastName: string;
    source: string;
    destination: string;
    dateTime: string;
    navigation: string;
    checkIn: string;
    tripStatus: string;
}

export async function getTrips(): Promise<Trip[]> {
    return tripsData;
}

export interface Connector {
    name: string;
    count: number;
    type: "AC" | "DC";
}

export interface StationSubmission {
    id: number;
    submissionDate: string;
    stationName: string;
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
}

export async function getStationSubmissions(): Promise<StationSubmission[]> {
    return stationSubmissionsData as StationSubmission[];
}


// --- Trip Check-ins API ---

export interface TripCheckin extends Trip {
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
    evolts_earned?: number | null; // Stored EVolts
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
    story_status?: "Pending" | "Approved" | "Rejected" | null;
    blog_link?: string | null;
}

export async function getTripCheckins(): Promise<TripCheckin[]> {
    // Merge existing tripsData with default optional fields for the new page
    return tripsData.map((trip: any) => ({
        ...trip,
        user_phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        ev: { brand: "Tata", model: "Nexon EV", variant: "XZ+" },
        rating: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
        feedback_provided: Math.random() > 0.5,
        charging_time: "00:45",
        connector: "CCS 2",
        rate_per_unit: 18.5,
        units_charged: 20,
        amount: 370,
        evolts_earned: null, // Let the page compute it initially
        photos: [],
        audit_log: [],
        flags: {},
        story_opt_in: Math.random() > 0.7,
        story_status: "Pending",
        blog_link: null
    }));
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

import customersData from "@/data/customers.json";
import stationSubmissionsData from "@/data/station-submissions.json";

export interface Customer {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vehicleRegDate: string;
    customerRegDate: string;
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

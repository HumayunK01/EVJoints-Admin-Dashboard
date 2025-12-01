import customersData from "@/data/customers.json";

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

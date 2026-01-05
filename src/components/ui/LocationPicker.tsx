"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    latitude: number;
    longitude: number;
    onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

function LocationMarker({ position, onLocationSelect }: { position: { lat: number; lng: number } | null, onLocationSelect: (lat: number, lng: number, address?: string) => void }) {
    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        if (position) {
            map.panTo(position);
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position} />
    );
}

export default function LocationPicker({ latitude, longitude, onLocationSelect }: LocationPickerProps) {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Initial center logic
    const defaultCenter = useMemo(() => {
        const isValid = latitude !== 0 || longitude !== 0;
        return isValid ? [latitude, longitude] as [number, number] : [20.5937, 78.9629] as [number, number];
    }, []);

    const position = useMemo(() => {
        const isValid = latitude !== 0 || longitude !== 0;
        return isValid ? { lat: latitude, lng: longitude } : null;
    }, [latitude, longitude]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        onLocationSelect(lat, lng, result.display_name);
        setSearchResults([]);
        setIsMapExpanded(false); // Collapse on selection
    };

    const handleMapClick = async (lat: number, lng: number) => {
        // Optimistically set location first
        onLocationSelect(lat, lng);

        // Reverse geocode
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                onLocationSelect(lat, lng, data.display_name);
            }
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
        }

        setIsMapExpanded(false); // Collapse on click
    };

    return (
        <div className="w-full mb-4">
            {/* Search Bar */}
            <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search location..."
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-dark outline-none focus:border-primary dark:border-dark-3 dark:text-white"
                    />
                    {searchResults.length > 0 && (
                        <ul className="absolute z-[1000] w-full bg-white dark:bg-gray-dark border border-stroke dark:border-dark-3 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {searchResults.map((result, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => selectSearchResult(result)}
                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-2 cursor-pointer text-sm text-dark dark:text-white border-b border-stroke dark:border-dark-3 last:border-0"
                                >
                                    {result.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                    {isSearching ? "..." : "Search"}
                </button>
            </div>

            {/* Map Expansion Control */}
            <div className="mb-2">
                {!isMapExpanded ? (
                    <button
                        onClick={() => setIsMapExpanded(true)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        Click to view/edit on map {position && "(Location Selected)"}
                    </button>
                ) : (
                    <button
                        onClick={() => setIsMapExpanded(false)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Hide Map
                    </button>
                )}
            </div>

            {/* Map Container */}
            {isMapExpanded && (
                <div className="h-[350px] w-full rounded-lg overflow-hidden border border-stroke dark:border-dark-3 relative z-0">
                    <MapContainer
                        center={position ? [position.lat, position.lng] : defaultCenter}
                        zoom={position ? 15 : 5}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker
                            position={position}
                            onLocationSelect={handleMapClick}
                        />
                    </MapContainer>
                </div>
            )}
        </div>
    );
}

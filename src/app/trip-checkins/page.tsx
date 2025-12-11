"use client";

import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CheckinsTable from "@/components/TripCheckins/CheckinsTable";
import { getTripCheckins, TripCheckin } from "@/lib/api";

export default function TripCheckinsPage() {
    const [data, setData] = useState<TripCheckin[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const checkins = await getTripCheckins();
                setData(checkins);
            } catch (error) {
                console.error("Failed to load checkins", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="mx-auto max-w-full">
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            ) : (
                <CheckinsTable initialData={data} />
            )}
        </div>
    );
}

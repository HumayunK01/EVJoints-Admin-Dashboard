import React from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import CheckinsTable from "@/components/TripCheckins/CheckinsTable";
import { getTripCheckinsPaginated } from "@/lib/api";

export default async function TripCheckinsPage() {
    // Fetch data server-side with fallback to local JSON
    const { data, pagination } = await getTripCheckinsPaginated(1, 10);

    return (
        <div className="mx-auto max-w-full">
            <CheckinsTable initialData={data} initialPagination={pagination} />
        </div>
    );
}

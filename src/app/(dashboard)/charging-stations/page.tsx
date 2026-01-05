
import ChargingStationsTable from "@/components/Tables/ChargingStationsTable";
import { Metadata } from "next";
import { getChargingStationsPaginated } from "@/lib/api";

export const metadata: Metadata = {
    title: "Charging Stations",
    description: "Manage EV charging stations",
};

export default async function ChargingStationsPage() {
    // Get first page with server-side pagination
    const response = await getChargingStationsPaginated(1, 10);

    return (
        <>
            <div className="flex flex-col gap-10">
                <ChargingStationsTable
                    initialData={response.data}
                    initialPagination={response.pagination}
                />
            </div>
        </>
    );
}

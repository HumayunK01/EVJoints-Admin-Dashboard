
import StationSubmissionsTable from "@/components/Tables/StationSubmissionsTable";
import { Metadata } from "next";
import { getStationSubmissionsPaginated } from "@/lib/api";

export const metadata: Metadata = {
    title: "Station Addition",
    description: "Manage EV charging station submissions",
};

export default async function StationSubmissionsPage() {
    // Get first page with server-side pagination
    const response = await getStationSubmissionsPaginated(1, 10);

    return (
        <>
            <div className="flex flex-col gap-10">
                <StationSubmissionsTable
                    initialData={response.data}
                    initialPagination={response.pagination}
                />
            </div>
        </>
    );
}

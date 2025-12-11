
import StationSubmissionsTable from "@/components/Tables/StationSubmissionsTable";
import { Metadata } from "next";
import { getStationSubmissions } from "@/lib/api";

export const metadata: Metadata = {
    title: "Station Addition",
    description: "Manage EV charging station submissions",
};

export default async function StationSubmissionsPage() {
    const submissions = await getStationSubmissions();

    return (
        <>
            <div className="flex flex-col gap-10">
                <StationSubmissionsTable submissions={submissions} />
            </div>
        </>
    );
}

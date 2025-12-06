
import { TripDetailsTable } from "@/components/Tables/TripDetailsTable";
import { Metadata } from "next";
import { getTrips } from "@/lib/api";

export const metadata: Metadata = {
    title: "Trip Details",
    description: "This is Trip Details page for EVJoints Admin Dashboard",
};

export default async function TripDetailsPage() {
    const trips = await getTrips();

    return (
        <>
            <div className="flex flex-col gap-10">
                <TripDetailsTable trips={trips} />
            </div>
        </>
    );
}

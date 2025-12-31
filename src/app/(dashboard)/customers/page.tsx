import { CustomersTable } from "@/components/Tables/CustomersTable";
import { Metadata } from "next";
import { getCustomersPaginated } from "@/lib/api";

export const metadata: Metadata = {
    title: "Customers",
    description: "This is Customers page for EVJoints Admin Dashboard",
};

export default async function CustomersPage() {
    // Server-side data fetching for optimal performance
    const response = await getCustomersPaginated(1, 10);

    return (
        <>
            <div className="flex flex-col gap-10">
                <CustomersTable
                    initialData={response.data}
                    initialPagination={response.pagination}
                />
            </div>
        </>
    );
}

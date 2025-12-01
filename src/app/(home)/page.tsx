
import { CustomersTable } from "@/components/Tables/CustomersTable";
import { Metadata } from "next";
import { getCustomers } from "@/lib/api";

export const metadata: Metadata = {
  title: "Customers",
  description: "This is Customers page for EVJoints Admin Dashboard",
};

export default async function Home() {
  const customers = await getCustomers();

  return (
    <>


      <div className="flex flex-col gap-10">
        <CustomersTable customers={customers} />
      </div>
    </>
  );
}

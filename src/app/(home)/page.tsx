
import { CustomersTable } from "@/components/Tables/CustomersTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
  description: "This is Customers page for EVJoints Admin Dashboard",
};

export default function Home() {
  return (
    <>


      <div className="flex flex-col gap-10">
        <CustomersTable />
      </div>
    </>
  );
}

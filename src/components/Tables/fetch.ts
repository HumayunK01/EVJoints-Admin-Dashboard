import * as logos from "@/assets/logos";
import invoicesData from "@/data/invoices.json";
import topChannelsData from "@/data/top-channels.json";
import topProductsData from "@/data/top-products.json";

export async function getTopProducts() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return topProductsData;
}

export async function getInvoiceTableData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1400));

  return invoicesData;
}

export async function getTopChannels() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return topChannelsData.map((channel) => ({
    ...channel,
    logo: logos[channel.logoName as keyof typeof logos],
  }));
}

import type { Metadata } from "next";
import { DestinationAdminWorkspace } from "@/features/admin/components/destinations/destination-admin-workspace";

export const metadata: Metadata = {
  title: "Admin Destinations | TravelVerse 3D",
};

export default function AdminDestinationsPage() {
  return <DestinationAdminWorkspace />;
}

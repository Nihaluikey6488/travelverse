import type { Metadata } from "next";
import { AdminAccessPanel } from "@/features/admin/components/admin-access-panel";

export const metadata: Metadata = {
  title: "Admin | TravelVerse 3D",
};

export default function AdminPage() {
  return <AdminAccessPanel />;
}

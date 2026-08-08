import type { Metadata } from "next";
import { AccountPanel } from "@/features/auth/components/account-panel";

export const metadata: Metadata = {
  title: "Account | TravelVerse 3D",
};

export default function AccountPage() {
  return <AccountPanel />;
}

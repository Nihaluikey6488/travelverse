import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = {
  title: "Register | TravelVerse 3D",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}

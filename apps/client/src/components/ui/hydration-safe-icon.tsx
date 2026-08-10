import type { LucideIcon, LucideProps } from "lucide-react";

type HydrationSafeIconProps = Omit<LucideProps, "ref"> & {
  icon: LucideIcon;
};

export function HydrationSafeIcon({ icon: Icon, ...props }: HydrationSafeIconProps) {
  return <Icon {...props} suppressHydrationWarning />;
}

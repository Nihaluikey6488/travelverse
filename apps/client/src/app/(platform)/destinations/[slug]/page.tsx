import { DestinationDetailExperience } from "@/features/discovery/components/destination-detail-experience";

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  return <DestinationDetailExperience slug={slug} />;
}

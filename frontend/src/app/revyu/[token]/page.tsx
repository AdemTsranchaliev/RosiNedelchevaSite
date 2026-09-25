import { ReviewInvite } from "@/components/ReviewInvite";

export function generateStaticParams() {
  return [{ token: "demo" }];
}

export default function ReviewPage() {
  return <ReviewInvite />;
}

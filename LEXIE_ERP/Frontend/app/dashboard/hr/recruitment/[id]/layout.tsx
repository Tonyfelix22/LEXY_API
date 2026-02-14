export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function RecruitmentIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

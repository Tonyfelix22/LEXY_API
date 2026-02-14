export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ReviewIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

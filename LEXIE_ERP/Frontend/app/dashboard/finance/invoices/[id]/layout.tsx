export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function InvoiceIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

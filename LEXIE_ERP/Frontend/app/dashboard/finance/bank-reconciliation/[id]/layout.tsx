export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function BankReconciliationIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

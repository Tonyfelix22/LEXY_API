export function generateStaticParams() {
  return [{ uid: "_", token: "_" }];
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

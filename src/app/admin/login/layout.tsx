export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page should not have sidebar or topbar
  return <>{children}</>;
}


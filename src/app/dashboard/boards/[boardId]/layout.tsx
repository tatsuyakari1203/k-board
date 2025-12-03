export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Board detail page cần full height, không cần padding
  return <div className="-m-6">{children}</div>;
}

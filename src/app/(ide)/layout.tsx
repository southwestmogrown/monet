import { IDEShell } from "@/components/shell/IDEShell";

export default function IDELayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <IDEShell>{children}</IDEShell>;
}

import { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children = null }: LayoutProps) {
  return (
    <div data-cmp="Layout" className="flex min-h-screen bg-background" style={{ minWidth: `1440px` }}>
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-h-screen" data-px-slot>
        {children}
      </main>
    </div>
  );
}

import Sidebar from '@/components/SheetSidebar';
import TopBar from '@/components/TopBar';

export default function AuditLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50 text-gray-900 text-sm">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

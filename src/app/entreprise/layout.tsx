export default function EntrepriseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-background font-archivo">
      {children}
    </div>
  );
}

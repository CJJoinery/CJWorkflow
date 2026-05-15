import "./globals.css";

export const metadata = {
  title: "CJ Joinery Workflow",
  description: "Work booking and planning system for CJ Joinery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand">
              <img src="/logo.png" alt="CJ Joinery Workflow" className="logo-full" />
            </div>

            <nav>
              <a href="/dashboard">Dashboard</a>
              <a href="/site-admin">Admin</a>
              <a href="/sites">Jobs / Sites</a>
              <a href="/programme">Work Planner</a>
              <a href="/programme-visual">Visual Board</a>
              <a href="/programme-gantt">Gantt Planner</a>
              <a href="/programme-print">Print Planner</a>
              <a href="/approvals">Change Requests</a>
              <a href="/profile">Profile</a>
              <a href="/login">Login</a>
            </nav>
          </aside>

          <section className="main-content">{children}</section>
        </div>
      </body>
    </html>
  );
}

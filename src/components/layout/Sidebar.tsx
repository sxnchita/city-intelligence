import {
  Link,
  useLocation,
} from "react-router-dom";

export default function Sidebar() {
  const location =
    useLocation();

  return (
    <aside
      style={{
        width: "210px",
        flexShrink: 0,
        background: "#091828",
        borderRight:
          "1px solid rgba(255,255,255,0.06)",
        padding: "22px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* BRAND */}

      <div
        style={{
          padding: "0 12px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            fontSize: "10px",
            color: "#64748b",
            letterSpacing: "1.6px",
            textTransform: "uppercase",
          }}
        >
          City Intelligence
        </div>

        <div
          style={{
            marginTop: "7px",
            fontSize: "19px",
            fontWeight: 750,
          }}
        >
          ANPR Command
        </div>
      </div>

      {/* NAV */}

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <SidebarLink
          label="Dashboard"
          to="/"
          active={
            location.pathname === "/"
          }
        />

        <SidebarLink
          label="Vehicle Search"
          to="/vehicles"
          active={
            location.pathname ===
            "/vehicles"
          }
        />

        <SidebarLink
          label="Traffic"
          to="/traffic"
          active={
            location.pathname ===
            "/traffic"
          }
        />

        <SidebarLink
          label="Alerts"
          to="/alerts"
          active={
            location.pathname ===
            "/alerts"
          }
        />

        <SidebarLink
          label="Analytics"
          to="/analytics"
          active={
            location.pathname ===
            "/analytics"
          }
        />

        <SidebarLink
          label="Camera Health"
          to="/cameras"
          active={
            location.pathname ===
            "/cameras"
          }
        />
      </nav>

      {/* FOOTER */}

      <div
        style={{
          marginTop: "auto",
          padding: "18px 12px 0",
          borderTop:
            "1px solid rgba(255,255,255,0.06)",
          fontSize: "11px",
          color: "#64748b",
        }}
      >
        SIH 2026 Prototype
      </div>
    </aside>
  );
}

function SidebarLink({
  label,
  to,
  active,
}: {
  label: string;
  to: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      style={{
        display: "block",
        textDecoration: "none",
        padding: "11px 12px",
        borderRadius: "9px",

        background:
          active
            ? "rgba(37,99,235,.25)"
            : "transparent",

        color:
          active
            ? "#60a5fa"
            : "#cbd5e1",

        fontSize: "12px",

        fontWeight:
          active
            ? 650
            : 500,

        transition:
          "background .15s ease, color .15s ease",
      }}
    >
      {label}
    </Link>
  );
}
import {
  Link,
  useLocation,
} from "react-router-dom";

type IconName =
  | "dashboard"
  | "vehicle"
  | "traffic"
  | "alerts"
  | "analytics"
  | "camera";

type NavItem = {
  label: string;
  to: string;
  icon: IconName;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: "dashboard",
  },
  {
    label: "Vehicle Search",
    to: "/vehicles",
    icon: "vehicle",
  },
  {
    label: "Traffic",
    to: "/traffic",
    icon: "traffic",
  },
  {
    label: "Alerts",
    to: "/alerts",
    icon: "alerts",
  },
  {
    label: "Analytics",
    to: "/analytics",
    icon: "analytics",
  },
  {
    label: "Camera Health",
    to: "/cameras",
    icon: "camera",
  },
];

export default function Sidebar() {
  const location =
    useLocation();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        flexShrink: 0,

        position: "relative",

        display: "flex",
        flexDirection: "column",

        background:
          "linear-gradient(180deg, #071727 0%, #081a2c 48%, #071523 100%)",

        borderRight:
          "1px solid rgba(148,163,184,.09)",

        boxShadow:
          "10px 0 32px rgba(0,0,0,.10)",

        overflow: "hidden",
      }}
    >
      {/* =======================================
          TOP BRAND
      ======================================= */}

      <div
        style={{
          padding:
            "26px 19px 21px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "11px",
          }}
        >
          {/* tiny city intelligence illustration */}

          <div
            style={{
              width: "35px",
              height: "48px",
              flexShrink: 0,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              color: "#7793b4",
            }}
          >
            <CityLogo />
          </div>

          <div
            style={{
              paddingTop: "2px",
            }}
          >
            <div
              style={{
                color: "#8ba2bd",

                fontSize: "7px",

                fontWeight: 700,

                letterSpacing:
                  "1.15px",

                textTransform:
                  "uppercase",
              }}
            >
              City Intelligence
            </div>

            <div
              style={{
                marginTop: "3px",

                color: "#f1f5f9",

                fontSize: "15px",

                fontWeight: 760,

                letterSpacing:
                  ".15px",
              }}
            >
              Operations
            </div>

            <div
              style={{
                marginTop: "3px",

                color: "#506a87",

                fontSize: "7px",

                lineHeight: 1.4,

                textTransform:
                  "uppercase",

                letterSpacing:
                  ".65px",
              }}
            >
              Traffic Intelligence
              <br />
              System
            </div>
          </div>
        </div>
      </div>

      {/* =======================================
          NAVIGATION
      ======================================= */}

      <nav
        style={{
          display: "flex",
          flexDirection: "column",

          padding: "6px 12px",

          gap: "7px",
        }}
      >
        {navItems.map(
          (item) => {
            const active =
              item.to === "/"
                ? location.pathname ===
                  "/"
                : location.pathname.startsWith(
                    item.to
                  );

            return (
              <NavLink
                key={item.to}
                item={item}
                active={active}
              />
            );
          }
        )}
      </nav>

      {/* =======================================
          BOTTOM AREA
      ======================================= */}

      <div
        style={{
          marginTop: "auto",

          padding: "0 13px 16px",
        }}
      >
        {/* CITY SKYLINE */}

        <div
          style={{
            height: "100px",

            display: "flex",
            alignItems: "flex-end",

            opacity: 0.48,

            overflow: "hidden",
          }}
        >
          <SkylineIllustration />
        </div>

        {/* PROFILE PANEL */}

        <div
          style={{
            marginTop: "8px",

            display: "flex",
            alignItems: "center",

            gap: "10px",

            padding: "10px 9px",

            borderRadius: "12px",

            background:
              "rgba(13,31,51,.62)",

            border:
              "1px solid rgba(148,163,184,.07)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",

              flexShrink: 0,

              borderRadius: "50%",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background:
                "linear-gradient(145deg,#153b68,#0c2540)",

              border:
                "1px solid rgba(96,165,250,.30)",

              color: "#8ec5ff",

              boxShadow:
                "0 0 14px rgba(37,99,235,.14)",
            }}
          >
            <UserIcon />
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                color: "#dce8f6",

                fontSize: "9.5px",

                fontWeight: 650,
              }}
            >
              Traffic Ops Center
            </div>

            <div
              style={{
                marginTop: "2px",

                color: "#536d89",

                fontSize: "7px",
              }}
            >
              Unified Command Center
            </div>
          </div>

          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#607b98"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m7 10 5 5 5-5" />
          </svg>
        </div>
      </div>
    </aside>
  );
}

// =======================================
// NAV LINK
// =======================================

function NavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  return (
    <Link
      to={item.to}
      style={{
        position: "relative",

        height: "44px",

        display: "flex",
        alignItems: "center",

        gap: "12px",

        padding: "0 13px",

        borderRadius: "8px",

        textDecoration: "none",

        color: active
          ? "#dbeafe"
          : "#90a4bb",

        background: active
          ? "linear-gradient(90deg, rgba(24,111,210,.34), rgba(19,84,155,.11))"
          : "transparent",

        border: active
          ? "1px solid rgba(59,130,246,.12)"
          : "1px solid transparent",

        fontSize: "10.5px",

        fontWeight: active
          ? 650
          : 520,

        transition:
          "all .18s ease",
      }}
    >
      {/* active blue line */}

      {active && (
        <span
          style={{
            position: "absolute",

            left: "-13px",

            top: "7px",
            bottom: "7px",

            width: "3px",

            borderRadius:
              "0 3px 3px 0",

            background:
              "#2497ff",

            boxShadow:
              "0 0 14px rgba(36,151,255,.7)",
          }}
        />
      )}

      {/* ICON */}

      <span
        style={{
          width: "18px",
          height: "18px",

          flexShrink: 0,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          color: active
            ? "#54a9ff"
            : "#7890aa",
        }}
      >
        <NavIcon
          name={item.icon}
        />
      </span>

      <span>
        {item.label}
      </span>

      {/* alert notification */}

      {item.icon ===
        "alerts" && (
        <span
          style={{
            width: "6px",
            height: "6px",

            marginLeft: "-8px",
            marginTop: "-17px",

            borderRadius: "50%",

            background:
              "#ef4444",

            boxShadow:
              "0 0 8px rgba(239,68,68,.8)",
          }}
        />
      )}
    </Link>
  );
}

// =======================================
// NAV ICONS
// =======================================

function NavIcon({
  name,
}: {
  name: IconName;
}) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
  };

  if (
    name === "dashboard"
  ) {
    return (
      <svg {...props}>
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1"
        />

        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1"
        />

        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1"
        />

        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1"
        />
      </svg>
    );
  }

  if (
    name === "vehicle"
  ) {
    return (
      <svg {...props}>
        <path d="M5 15.5V13l2-5h10l2 5v2.5" />

        <path d="M5 15.5h14v3H5z" />

        <circle
          cx="8"
          cy="18.5"
          r="1.5"
        />

        <circle
          cx="16"
          cy="18.5"
          r="1.5"
        />

        <path d="M7 13h10" />
      </svg>
    );
  }

  if (
    name === "traffic"
  ) {
    return (
      <svg {...props}>
        <path d="M6 21 10 3" />

        <path d="m18 21-4-18" />

        <path d="M12 4v3" />
        <path d="M12 10v3" />
        <path d="M12 16v3" />
      </svg>
    );
  }

  if (
    name === "alerts"
  ) {
    return (
      <svg {...props}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

        <path d="M10 21h4" />
      </svg>
    );
  }

  if (
    name === "analytics"
  ) {
    return (
      <svg {...props}>
        <path d="M5 20V11" />

        <path d="M12 20V4" />

        <path d="M19 20v-7" />

        <path d="M3 20h18" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M5 8h14v9H5z" />

      <path d="M8 8 10 5h4l2 3" />

      <circle
        cx="12"
        cy="12.5"
        r="2.2"
      />

      <path d="M9 17v2" />

      <path d="M15 17v2" />

      <path d="M8 19h8" />
    </svg>
  );
}

// =======================================
// TOP CITY LOGO
// =======================================

function CityLogo() {
  return (
    <svg
      width="35"
      height="48"
      viewBox="0 0 42 58"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* tower */}

      <path d="M19 55V23" />

      <path d="M23 55V20" />

      <path d="M21 20V9" />

      <path d="M21 9V4" />

      <path d="M18 27h8" />

      <path d="M18 34h8" />

      {/* left city */}

      <path d="M3 55V35h8v20" />

      <path d="M7 35v-7" />

      <path d="M11 55V31h5v24" />

      <path d="M5 39h2" />
      <path d="M5 44h2" />
      <path d="M13 36h1" />
      <path d="M13 41h1" />

      {/* right buildings */}

      <path d="M27 55V27h5v28" />

      <path d="M32 55V37h7v18" />

      <path d="M29 32h1" />

      <path d="M29 38h1" />

      <path d="M35 42h1" />

      {/* curved city network */}

      <path d="M2 28c7 4 11 2 17-3" />

      <path d="M24 19c5 4 9 4 15 1" />

      <circle
        cx="5"
        cy="27"
        r="1"
      />

      <circle
        cx="36"
        cy="20"
        r="1"
      />

      <path d="M1 55h40" />
    </svg>
  );
}

// =======================================
// BOTTOM CITY SKYLINE
// =======================================

function SkylineIllustration() {
  return (
    <svg
      width="100%"
      height="82"
      viewBox="0 0 200 82"
      fill="none"
      stroke="#456789"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* CLOUDS */}

      <path d="M5 34c2-5 8-5 10 0 5-3 9 0 9 4H3c0-2 1-3 2-4Z" />

      <path d="M70 27c2-5 8-5 10 0 5-3 9 0 9 4H68c0-2 1-3 2-4Z" />

      {/* LEFT BUILDINGS */}

      <path d="M6 76V48h13v28" />

      <path d="M10 48v-8h5v8" />

      <path d="M23 76V54h11v22" />

      <path d="M28 54v-12" />

      <path d="M9 54h2M14 54h2M9 59h2M14 59h2M9 64h2M14 64h2" />

      {/* CENTRAL TOWER */}

      <path d="M43 76V42h14v34" />

      <path d="M47 42V33h6v9" />

      <path d="M50 33v-8" />

      <path d="M46 50h8M46 57h8M46 64h8" />

      {/* ROAD / LAND */}

      <path d="M0 76h200" />

      <path d="M0 71c27-7 51-5 79 0 26 5 47 5 72 0 17-4 32-4 49 0" />

      {/* small trees */}

      <path d="M84 76V62" />
      <circle
        cx="84"
        cy="58"
        r="6"
      />

      <path d="M104 76V64" />
      <circle
        cx="104"
        cy="60"
        r="5"
      />

      {/* right buildings */}

      <path d="M125 76V51h12v25" />

      <path d="M140 76V39h15v37" />

      <path d="M144 39v-7h7v7" />

      <path d="M159 76V47h17v29" />

      <path d="M181 76V57h12v19" />

      <path d="M144 47h3M150 47h3M144 53h3M150 53h3M144 59h3M150 59h3" />

      <path d="M163 54h3M170 54h3M163 60h3M170 60h3" />
    </svg>
  );
}

// =======================================
// USER ICON
// =======================================

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21c1-5 4-7 8-7s7 2 8 7" />
    </svg>
  );
}
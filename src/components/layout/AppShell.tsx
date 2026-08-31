import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

import ConnectionBadge, {
  type ConnectionState,
} from "../common/ConnectionBadge";
import { Icon } from "../../design/ui";

// =====================================================================
// APP SHELL
//
// One top nav across every screen. The Stitch comps each invented a
// different nav list and two different wordmarks; the nav here comes
// from the routes that actually exist.
//
// The bar sits over the map rather than beside it — every dashboard
// screen in the design is a full-bleed map with content floating on
// top, so the chrome has to be thin and transparent.
// =====================================================================

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vehicles", label: "Journeys" },
  { to: "/traffic", label: "Traffic" },
  { to: "/alerts", label: "Alerts" },
  { to: "/analytics", label: "Analytics" },
  { to: "/cameras", label: "Cameras" },
];

export default function AppShell({
  children,
  connection,
  connectionTitle,
  actions,
}: {
  children: ReactNode;
  connection?: ConnectionState;
  connectionTitle?: string;
  actions?: ReactNode;
}) {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-paper text-on-surface">
      <header className="hairline-b z-30 flex h-20 shrink-0 items-center gap-8 bg-background px-container">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5"
          title="ANPR City Engine — home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="videocam" size={17} />
          </span>
          <span className="font-display text-headline-sm tracking-tight text-primary">
            ANPR City Engine
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              location.pathname === item.to ||
              (item.to === "/vehicles" &&
                location.pathname.startsWith("/vehicles"));

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-sm px-3 py-2 font-body text-label-caps uppercase transition-colors ${
                  active
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <span
                  className={
                    active
                      ? "border-b-2 border-primary pb-1"
                      : "border-b-2 border-transparent pb-1"
                  }
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {actions}
          {connection && (
            <ConnectionBadge
              state={connection}
              title={connectionTitle}
            />
          )}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * The shared dashboard archetype: a full-bleed map with a translucent
 * rail floating over its left edge. Four of the five screens are this.
 */
export function MapWorkspace({
  panel,
  map,
  overlays,
}: {
  panel: ReactNode;
  map: ReactNode;
  overlays?: ReactNode;
}) {
  return (
    <div className="relative flex h-full w-full">
      <div className="absolute inset-0 z-0">{map}</div>
      {panel}
      {overlays}
    </div>
  );
}

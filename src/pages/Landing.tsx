import { Link } from "react-router-dom";

import mapHero from "../assets/map-hero.png";
import { useApiData } from "../hooks/useApiData";
import { Figure, Icon } from "../design/ui";
import { getCameras, getGraph } from "../services/mapApi";
import { getSystemHealth } from "../services/systemApi";
import { getEvaluation } from "../services/identityApi";

// =====================================================================
// LANDING
//
// The one screen where the hand-drawn map is used as an illustration —
// everywhere else the spec requires a real GIS base. Here it is
// decoration and nothing is plotted on it.
//
// The four figures are live reads, not copy. On a cold database they
// show a dash rather than a fabricated number.
// =====================================================================

type LandingStats = {
  cameras: number;
  roadLinks: number;
  sightings: number;
  linkPrecision: number | null;
  precisionDenominator: number;
};

export default function Landing() {
  const { data } = useApiData<LandingStats>(async (signal) => {
    // Each figure comes from the endpoint that actually owns it.
    const [cameras, graph, health, evaluation] = await Promise.all([
      getCameras(signal),
      getGraph(signal),
      getSystemHealth(signal),
      getEvaluation(signal),
    ]);

    return {
      cameras: cameras.features.length,
      roadLinks: graph.edge_count,
      sightings: health.observation_count,
      linkPrecision: evaluation.link_precision.rate,
      precisionDenominator: evaluation.link_precision.denominator,
    };
  }, []);

  const figure = (value: number | undefined) =>
    value === undefined ? "—" : value.toLocaleString();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-on-background">
      {/* Illustrated city, dimmed to sit behind the type. */}
      <div className="absolute inset-0 z-0">
        <img
          src={mapHero}
          alt=""
          className="h-full w-full object-cover opacity-80 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface/40 via-surface/60 to-surface/90" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-container py-8 md:py-12">
        <header className="mb-16 flex w-full items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="videocam" size={18} />
            </span>
            <span className="font-display text-headline-sm tracking-tight text-primary">
              ANPR City Engine
            </span>
          </div>

          <div className="hidden flex-col items-end text-right md:flex">
            <span className="font-body text-label-caps uppercase text-on-surface-variant">
              Smart India Hackathon 2026 · Problem Statement 26127
            </span>
            <span className="mt-1 font-body text-label-caps uppercase text-primary">
              Bharat Electronics Limited
            </span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-4xl flex-grow flex-col items-center justify-center gap-12 text-center">
          <div className="space-y-6">
            <h1 className="font-display text-display-lg leading-tight text-on-background md:text-[64px]">
              City-Wide Vehicle Trajectory
              <br />
              <span className="font-normal italic text-primary">
                &amp; Traffic Intelligence
              </span>
            </h1>

            <p className="mx-auto max-w-2xl font-body text-body-lg text-on-surface-variant">
              Reconstructing vehicle journeys across a city, from cameras
              you already own. A refined, editorial approach to traffic
              analysis.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-8 border-y border-outline-variant/30 py-8 md:gap-12">
            <Figure value={figure(data?.cameras)} label="Cameras" />
            <div className="hidden h-12 w-px bg-outline-variant/30 md:block" />
            <Figure value={figure(data?.roadLinks)} label="Road Links" />
            <div className="hidden h-12 w-px bg-outline-variant/30 md:block" />
            <Figure value={figure(data?.sightings)} label="Sightings" />
            <div className="hidden h-12 w-px bg-outline-variant/30 md:block" />
            <Figure
              // Precision is meaningless without its denominator, so a
              // run with no ground truth yet shows a dash, not "1.00".
              value={
                data?.linkPrecision != null
                  ? data.linkPrecision.toFixed(2)
                  : "—"
              }
              label="Link Precision"
              detail={
                data && data.precisionDenominator > 0
                  ? `over ${data.precisionDenominator.toLocaleString()} links`
                  : undefined
              }
            />
          </div>
        </main>

        <footer className="mt-16 mb-8 flex w-full flex-col items-center justify-center gap-6 md:flex-row">
          <Link
            to="/dashboard"
            className="ambient-shadow inline-flex items-center gap-2 rounded-full bg-primary-container px-8 py-4 font-body text-label-caps uppercase text-on-primary-container transition-colors duration-300 hover:bg-primary"
          >
            Open Dashboard
            <Icon name="arrow_forward" size={16} />
          </Link>

          <Link
            to="/vehicles"
            className="font-body text-body-md text-on-surface-variant underline decoration-outline-variant underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Trace a vehicle
          </Link>
        </footer>
      </div>
    </div>
  );
}

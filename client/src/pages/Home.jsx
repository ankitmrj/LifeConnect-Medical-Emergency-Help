import { Link } from "react-router-dom";
import {
  Siren,
  MapPinned,
  Radio,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  // -----------------------------
  // Feature cards
  // -----------------------------
  const features = [
    [MapPinned, "Geo-aware"],
    [Radio, "Real-time"],
    [ShieldCheck, "RBAC"],
    [Siren, "One-tap SOS"],
  ];

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="overflow-hidden rounded-3xl bg-slate-950 p-8 text-white md:p-14">
      {/* Hero Content */}
      <div className="max-w-3xl">
        {/* Platform Label */}
        <div className="flex items-center gap-2 text-red-400">
          <Siren />
          Emergency coordination platform
        </div>

        {/* Heading */}
        <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">
          One SOS.
          <br />
          Many lives connected.
        </h1>

        {/* Description */}
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          LifeConnect links patients, hospitals and ambulances
          with location-aware emergency routing and real-time
          response tracking.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-red-600 px-6 py-3 font-bold"
          >
            Get started
          </Link>

          <Link
            to="/login"
            className="rounded-xl border border-white/20 px-6 py-3 font-bold"
          >
            Open demo
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mt-12 grid gap-4 md:grid-cols-4">
        {features.map(([Icon, title]) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <Icon className="text-red-400" />

            <div className="mt-3 font-bold">
              {title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
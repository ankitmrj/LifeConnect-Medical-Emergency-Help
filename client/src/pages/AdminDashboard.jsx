import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, Hospital, Ambulance, Activity } from "lucide-react";

import { api } from "../services/api";
import StatCard from "../components/StatCard";

export default function AdminDashboard() {
  // -----------------------------
  // State
  // -----------------------------
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);

  // -----------------------------
  // Load dashboard data
  // -----------------------------
  const loadDashboard = () => {
    return Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/hospitals"),
    ]).then(([statsResponse, hospitalsResponse]) => {
      setStats(statsResponse.data.data);
      setHospitals(hospitalsResponse.data.data.hospitals);
    });
  };

  // -----------------------------
  // Initial API call
  // -----------------------------
  useEffect(() => {
    loadDashboard();
  }, []);

  // -----------------------------
  // Chart data
  // -----------------------------
  const chartData = stats
    ? [
        {
          name: "Patients",
          value: stats.patients,
        },
        {
          name: "Hospitals",
          value: stats.hospitals,
        },
        {
          name: "Ambulances",
          value: stats.ambulances,
        },
        {
          name: "Active",
          value: stats.activeEmergencies,
        },
        {
          name: "Completed",
          value: stats.completedEmergencies,
        },
      ]
    : [];

  // -----------------------------
  // Pending hospitals
  // -----------------------------
  const pendingHospitals = hospitals.filter(
    (hospital) => !hospital.isVerified
  );

  // -----------------------------
  // Verify hospital
  // -----------------------------
  const verifyHospital = (hospitalId) => {
    api
      .patch(`/admin/hospitals/${hospitalId}/verify`)
      .then(() => loadDashboard());
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {stats && (
        <>
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black">
              Admin Control Center
            </h1>

            <p className="text-slate-500">
              Platform overview and verification
            </p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Users"
              value={stats.users}
              icon={Users}
            />

            <StatCard
              label="Hospitals"
              value={stats.hospitals}
              icon={Hospital}
            />

            <StatCard
              label="Ambulances"
              value={stats.ambulances}
              icon={Ambulance}
            />

            <StatCard
              label="Active Emergencies"
              value={stats.activeEmergencies}
              icon={Activity}
            />
          </div>

          {/* Platform Snapshot */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="font-black">
              Platform Snapshot
            </h2>

            <div className="mt-5 h-64">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />

                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hospital Verification */}
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">
              Hospital Verification
            </h2>

            <div className="mt-4 space-y-3">
              {pendingHospitals.map((hospital) => (
                <div
                  key={hospital._id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <span>{hospital.name}</span>

                  <button
                    onClick={() =>
                      verifyHospital(hospital._id)
                    }
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white"
                  >
                    Verify
                  </button>
                </div>
              ))}

              {pendingHospitals.length === 0 && (
                <div className="text-slate-500">
                  No pending verifications.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
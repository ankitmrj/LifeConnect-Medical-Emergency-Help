import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bed,
  Ambulance,
  AlertTriangle,
  CheckCircle2,
  ShieldPlus,
} from "lucide-react";

import { api } from "../services/api";
import { useSocket } from "../hooks/useSocket";
import StatCard from "../components/StatCard";

export default function HospitalDashboard() {
  // -----------------------------
  // State
  // -----------------------------
  const [dashboard, setDashboard] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [resources, setResources] = useState(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // -----------------------------
  // Load dashboard
  // -----------------------------
  const loadDashboard = () => {
    setError("");

    return api
      .get("/hospitals/dashboard/me")
      .then((response) => {
        const data = response.data.data;

        setDashboard(data);

        setResources({
          availableBeds: data.hospital.availableBeds,
          icuAvailable: data.hospital.icuAvailable,
          oxygenAvailable: data.hospital.oxygenAvailable,
          emergencyAvailable: data.hospital.emergencyAvailable,
          antivenomAvailable: data.hospital.antivenomAvailable,
          antivenomUnits: data.hospital.antivenomUnits,
          bloodBank: Object.fromEntries(
            Object.entries(data.hospital.bloodBank || {})
          ),
        });
      })
      .catch((err) => {
        if (
          err.response?.status === 404 &&
          err.response?.data?.error === "NOT_FOUND"
        ) {
          navigate("/hospital/setup", {
            replace: true,
          });

          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load hospital dashboard"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // -----------------------------
  // Initial load
  // -----------------------------
  useEffect(() => {
    loadDashboard();
  }, []);

  // -----------------------------
  // Socket: Hospital notification
  // -----------------------------
  useSocket({
    "emergency:hospital-notified": (emergency) => {
      setToast(
        `New ${emergency.priority} emergency nearby`
      );

      loadDashboard();
    },
  });

  // -----------------------------
  // Generic emergency action
  // -----------------------------
  const performAction = (promise) => {
    promise
      .then(() => loadDashboard())
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            "Unable to update emergency"
        );
      });
  };

  // -----------------------------
  // Accept emergency
  // -----------------------------
  const acceptEmergency = (id) => {
    performAction(
      api.post(`/emergencies/${id}/accept`)
    );
  };

  // -----------------------------
  // Assign ambulance
  // -----------------------------
  const assignAmbulance = (id) => {
    performAction(
      api.post(`/emergencies/${id}/assign-ambulance`, {})
    );
  };

  // -----------------------------
  // Update antivenom resource
  // -----------------------------
  const updateResources = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const availableBeds = Number(resources.availableBeds);
      const antivenomUnits = Number(resources.antivenomUnits);

      if (
        !Number.isInteger(availableBeds) ||
        availableBeds < 0 ||
        availableBeds > dashboard.hospital.totalBeds
      ) {
        throw new Error(
          `Available beds must be an integer between 0 and ${dashboard.hospital.totalBeds}`
        );
      }

      if (!Number.isFinite(antivenomUnits) || antivenomUnits < 0) {
        throw new Error("Antivenom units must be a non-negative number");
      }

      await api.put(
        `/hospitals/${dashboard.hospital._id}/resources`,
        {
          ...resources,
          availableBeds,
          antivenomUnits,
        }
      );

      await loadDashboard();
      setSuccess("Hospital resources updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update hospital resources"
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Loading state
  // -----------------------------
  if (loading && !dashboard) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-slate-500">
        Loading hospital dashboard...
      </div>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          {toast}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      )}

      {dashboard && (
        <>
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black">
              {dashboard.hospital.name}
            </h1>

            <p className="text-slate-500">
              Hospital command center
            </p>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-5">
            <StatCard
              label="Active Emergencies"
              value={dashboard.metrics.active}
              icon={AlertTriangle}
            />

            <StatCard
              label="Available Beds"
              value={dashboard.metrics.availableBeds}
              icon={Bed}
            />

            <StatCard
              label="Available Ambulances"
              value={dashboard.metrics.availableAmbulances}
              icon={Ambulance}
            />

            <StatCard
              label="Completed Cases"
              value={dashboard.metrics.completed}
              icon={CheckCircle2}
            />

            <StatCard
              label="Antivenom"
              value={
                dashboard.hospital.antivenomAvailable
                  ? `${dashboard.hospital.antivenomUnits} units`
                  : "Unavailable"
              }
              icon={ShieldPlus}
            />
          </div>

          {/* Hospital Resource Management */}
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Hospital Resource Management</h2>
            <p className="mt-1 text-sm text-slate-500">Update the resources available at your hospital.</p>

            <form
              className="mt-5 space-y-5"
              onSubmit={updateResources}
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  Available beds
                  <input className="rounded-xl border px-3 py-2 text-slate-900" type="number" min="0" max={dashboard.hospital.totalBeds} value={resources.availableBeds} onChange={(event) => setResources({ ...resources, availableBeds: event.target.value })} />
                </label>

                {[['icuAvailable', 'ICU available'], ['oxygenAvailable', 'Oxygen available'], ['emergencyAvailable', 'Emergency available'], ['antivenomAvailable', 'Antivenom available']].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
                    <input type="checkbox" checked={resources[key]} onChange={(event) => setResources({ ...resources, [key]: event.target.checked })} />
                    {label}
                  </label>
                ))}

                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  Antivenom units
                  <input className="rounded-xl border px-3 py-2 text-slate-900" type="number" min="0" value={resources.antivenomUnits} onChange={(event) => setResources({ ...resources, antivenomUnits: event.target.value })} />
                </label>
              </div>

              <div>
                <h3 className="font-bold">Blood Bank</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {Object.entries(resources.bloodBank).map(([group, units]) => (
                    <label key={group} className="flex flex-col gap-1 text-sm text-slate-600">
                      {group}
                      <input className="rounded-xl border px-3 py-2 text-slate-900" type="number" min="0" value={units} onChange={(event) => setResources({ ...resources, bloodBank: { ...resources.bloodBank, [group]: event.target.value } })} />
                    </label>
                  ))}
                </div>
              </div>

              <button
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Resources"}
              </button>
            </form>
          </section>

          {/* Emergency Requests */}
          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex justify-between">
              <h2 className="text-xl font-black">
                Emergency Requests
              </h2>

              <span className="text-sm text-slate-500">
                Critical first
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {dashboard.requests.map((emergency) => (
                <div
                  key={emergency._id}
                  className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  {/* Emergency information */}
                  <div>
                    <div className="font-bold">
                      {emergency.patientId?.name || "Patient"}{" "}
                      - {emergency.priority}
                    </div>

                    <div className="text-sm text-slate-500">
                      {emergency.emergencyType} -{" "}
                      {emergency.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {emergency.status ===
                      "HOSPITAL_NOTIFIED" && (
                      <button
                        onClick={() =>
                          acceptEmergency(emergency._id)
                        }
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white"
                      >
                        Accept
                      </button>
                    )}

                    {emergency.status === "ACCEPTED" && (
                      <button
                        onClick={() =>
                          assignAmbulance(emergency._id)
                        }
                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Assign Ambulance
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
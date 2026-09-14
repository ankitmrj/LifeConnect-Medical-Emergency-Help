import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

// -----------------------------
// Initial form state
// -----------------------------
const initialForm = {
  name: "",
  registrationNumber: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  lat: "",
  lng: "",
  departments: "",
  services: "",
  emergencyAvailable: true,
  icuAvailable: false,
  totalBeds: 0,
  availableBeds: 0,
  oxygenAvailable: false,
  antivenomAvailable: false,
  antivenomUnits: 0,
  bloodBank: "",
};

export default function HospitalSetup() {
  // -----------------------------
  // State
  // -----------------------------
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { user, hospitalPath } = useAuth();
  const navigate = useNavigate();

  // -----------------------------
  // Check hospital profile
  // -----------------------------
  useEffect(() => {
    hospitalPath()
      .then((path) => {
        if (path === "/hospital") {
          navigate(path, {
            replace: true,
          });
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            "Unable to check hospital profile"
        );
      });
  }, []);

  // -----------------------------
  // Update form field
  // -----------------------------
  const update = (key) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm({
      ...form,
      [key]: value,
    });
  };

  // -----------------------------
  // Submit form
  // -----------------------------
  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setSaving(true);

    // -----------------------------
    // Convert blood bank string
    // Example: A+:10,O-:4
    // -----------------------------
    const bloodBank = form.bloodBank
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .reduce((values, item) => {
        const [type, count] = item.split(":");

        if (type && count !== undefined) {
          values[type.trim()] = Number(count);
        }

        return values;
      }, {});

    // -----------------------------
    // Prepare API payload
    // -----------------------------
    const payload = {
      ...form,

      email: form.email || user?.email || "",

      departments: form.departments
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      services: form.services
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      lat: Number(form.lat),
      lng: Number(form.lng),

      totalBeds: Number(form.totalBeds),
      availableBeds: Number(form.availableBeds),

      antivenomUnits: Number(form.antivenomUnits),

      bloodBank,
    };

    // Keep bloodBank only when values exist
    delete payload.bloodBank;

    if (Object.keys(bloodBank).length) {
      payload.bloodBank = bloodBank;
    }

    // -----------------------------
    // Create hospital profile
    // -----------------------------
    try {
      await api.post("/hospitals", payload);

      navigate("/hospital", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create hospital profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-8 shadow-sm">
      {/* Header */}
      <h1 className="text-3xl font-black">
        Set up your hospital profile
      </h1>

      <p className="mt-2 text-slate-500">
        Complete the profile before opening the hospital
        command center.
      </p>

      {/* Form */}
      <form
        className="mt-8 space-y-6"
        onSubmit={submit}
      >
        {/* Basic Information */}
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["name", "Hospital name", true],
            ["registrationNumber", "Registration number"],
            ["phone", "Phone"],
            ["email", "Email"],
            ["address", "Address"],
            ["lat", "Latitude", true],
            ["lng", "Longitude", true],
          ].map(([key, label, required]) => (
            <input
              key={key}
              required={required}
              className="w-full rounded-xl border px-4 py-3"
              placeholder={label}
              value={
                form[key] ||
                (key === "email" ? user?.email : "")
              }
              onChange={update(key)}
            />
          ))}
        </div>

        {/* Description */}
        <textarea
          className="min-h-24 w-full rounded-xl border px-4 py-3"
          placeholder="Description"
          value={form.description}
          onChange={update("description")}
        />

        {/* Hospital Details */}
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Departments, comma separated"
            value={form.departments}
            onChange={update("departments")}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Services, comma separated"
            value={form.services}
            onChange={update("services")}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            type="number"
            min="0"
            placeholder="Total beds"
            value={form.totalBeds}
            onChange={update("totalBeds")}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            type="number"
            min="0"
            placeholder="Available beds"
            value={form.availableBeds}
            onChange={update("availableBeds")}
          />

          <input
            className="w-full rounded-xl border px-4 py-3"
            type="number"
            min="0"
            placeholder="Antivenom units"
            value={form.antivenomUnits}
            onChange={update("antivenomUnits")}
          />
        </div>

        {/* Availability Options */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.emergencyAvailable}
              onChange={update("emergencyAvailable")}
            />

            Emergency services available
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.icuAvailable}
              onChange={update("icuAvailable")}
            />

            ICU available
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.oxygenAvailable}
              onChange={update("oxygenAvailable")}
            />

            Oxygen available
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.antivenomAvailable}
              onChange={update("antivenomAvailable")}
            />

            Antivenom available
          </label>
        </div>

        {/* Blood Bank */}
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Blood bank, e.g. A+:10,O-:4"
          value={form.bloodBank}
          onChange={update("bloodBank")}
        />

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          disabled={saving}
          className="w-full rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-60"
        >
          {saving
            ? "Saving profile..."
            : "Create hospital profile"}
        </button>
      </form>
    </div>
  );
}
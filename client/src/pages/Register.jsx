import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Register() {
  // -----------------------------
  // Form state
  // -----------------------------
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
  });

  const [error, setError] = useState("");

  const navigate = useNavigate();

  const { register, hospitalPath } = useAuth();

  // -----------------------------
  // Update form field
  // -----------------------------
  const updateField = (key) => (event) => {
    setForm({
      ...form,
      [key]: event.target.value,
    });
  };

  // -----------------------------
  // Handle registration
  // -----------------------------
  const handleRegister = async () => {
    setError("");

    try {
      const user = await register(form);

      if (user.role === "hospital") {
        navigate(await hospitalPath());
      } else if (user.role === "patient") {
        navigate("/patient");
      } else {
        navigate(`/${user.role}`);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Registration failed"
      );
    }
  };

  // -----------------------------
  // Form fields
  // -----------------------------
  const fields = [
    "name",
    "email",
    "phone",
    "password",
  ];

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-3xl border bg-white p-8 shadow-sm">
      {/* Header */}
      <h1 className="text-3xl font-black">
        Create account
      </h1>

      {/* Form */}
      <div className="mt-6 space-y-4">
        {/* Basic Fields */}
        {fields.map((field) => (
          <input
            key={field}
            className="w-full rounded-xl border px-4 py-3"
            type={
              field === "password"
                ? "password"
                : "text"
            }
            placeholder={
              field[0].toUpperCase() +
              field.slice(1)
            }
            value={form[field]}
            onChange={updateField(field)}
          />
        ))}

        {/* Role */}
        <select
          className="w-full rounded-xl border px-4 py-3"
          value={form.role}
          onChange={updateField("role")}
        >
          <option value="patient">
            Patient
          </option>

          <option value="hospital">
            Hospital
          </option>

          <option value="ambulance">
            Ambulance
          </option>
        </select>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* Register */}
        <button
          onClick={handleRegister}
          className="w-full rounded-xl bg-red-600 px-4 py-3 font-bold text-white"
        >
          Register
        </button>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Login() {
  // -----------------------------
  // State
  // -----------------------------
  const [email, setEmail] = useState(
    "patient1@lifeconnect.demo"
  );

  const [password, setPassword] = useState(
    "Demo@12345"
  );

  const [error, setError] = useState("");

  const { login, hospitalPath } = useAuth();
  const navigate = useNavigate();

  // -----------------------------
  // Handle login
  // -----------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    try {
      const user = await login(email, password);

      if (user.role === "hospital") {
        navigate(await hospitalPath());
      } else if (user.role === "patient") {
        navigate("/patient");
      } else {
        navigate(`/${user.role}`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed"
      );
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="mx-auto mt-12 max-w-md rounded-3xl border bg-white p-8 shadow-sm">
      {/* Icon */}
      <ShieldAlert
        className="mx-auto text-red-600"
        size={42}
      />

      {/* Header */}
      <h1 className="mt-4 text-center text-3xl font-black">
        Welcome back
      </h1>

      <p className="mt-2 text-center text-slate-500">
        Emergency care coordination, one connection away.
      </p>

      {/* Login Form */}
      <form
        className="mt-8 space-y-4"
        onSubmit={handleSubmit}
      >
        {/* Email */}
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
        />

        {/* Password */}
        <input
          className="w-full rounded-xl border px-4 py-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 font-bold text-white"
        >
          Login
        </button>
      </form>

      {/* Register Link */}
      <p className="mt-6 text-center text-sm">
        New patient?{" "}
        <Link
          className="font-bold text-red-600"
          to="/register"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
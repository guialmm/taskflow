import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { login } from "../../api/auth";
import { useAuthStore } from "../../store/auth";

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const res = await login(data);
      setAuth(res.user, res.access_token);
      navigate("/");
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white text-2xl font-bold shadow-lg shadow-primary-500/30">T</div>
          <h1 className="text-2xl font-bold text-slate-100">TaskFlow</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-800/50 p-3 text-sm text-red-400 animate-fade-in-up">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              {...register("email", { required: true })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              {...register("password", { required: true })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary-400 hover:text-primary-300 hover:underline transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

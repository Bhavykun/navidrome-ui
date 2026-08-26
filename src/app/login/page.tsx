"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, LoaderCircle, Music2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(baseUrl.trim()) && process.env.NODE_ENV === "production") {
      setError("Use your public Tailscale Funnel URL here, not localhost.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, username, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Unable to sign in");
      }
      router.replace("/");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080a09] px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c7f36b] text-black"><Music2 size={24} /></div>
          <div><p className="text-xl font-semibold">Northstar</p><p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">Navidrome client</p></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101310] p-6 shadow-2xl sm:p-8">
          <h1 className="text-2xl font-semibold">Sign in to your library</h1>
          <p className="mt-2 text-sm text-zinc-500">Use your Navidrome account to continue.</p>
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm text-zinc-400">Server URL<input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://your-device.your-tailnet.ts.net" className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-[#c7f36b]" /></label>
            <label className="block text-sm text-zinc-400">Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-[#c7f36b]" /></label>
            <label className="block text-sm text-zinc-400">Password<div className="relative mt-2"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 pr-11 text-white outline-none focus:border-[#c7f36b]" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-zinc-500 hover:text-white" title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-3 text-sm text-red-200">{error}</p>}
            <button type="submit" disabled={loading || !baseUrl.trim() || !username.trim() || !password} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c7f36b] px-4 py-3 font-semibold text-black transition hover:bg-[#dafa96] disabled:cursor-not-allowed disabled:opacity-40">{loading && <LoaderCircle size={18} className="animate-spin" />} {loading ? "Connecting..." : "Sign in"}</button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-zinc-600">Your credentials are encrypted in a server-only session.</p>
      </div>
    </main>
  );
}

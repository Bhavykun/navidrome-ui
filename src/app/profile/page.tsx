"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { ArrowLeft, Camera, ListMusic, LogOut, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import Artwork from "@/components/Artwork";
import { PlaybackQuality, usePlayer } from "@/context/PlayerContext";

type Playlist = {
  id: string;
  name: string;
  songCount?: number;
  duration?: number;
  coverArt?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { quality, setQuality } = usePlayer();
  const [username, setUsername] = useState("Music listener");
  const [bio, setBio] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("northstar_profile_bio") ?? "");
  const [savedBio, setSavedBio] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("northstar_profile_bio") ?? "");
  const [avatar, setAvatar] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("northstar_profile_avatar") ?? "");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const [sessionResponse, playlistsResponse] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }),
          fetch("/api/navidrome/playlists", { cache: "no-store" }),
        ]);
        const session = await sessionResponse.json();
        const playlistData = await playlistsResponse.json();
        setUsername(session.username ?? "Music listener");
        setPlaylists(playlistData["subsonic-response"]?.playlists?.playlist ?? []);
      } catch (error) {
        console.error("Profile loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function saveProfile() {
    window.localStorage.setItem("northstar_profile_bio", bio.trim());
    setSavedBio(bio.trim());
    setMessage("Profile saved");
    window.setTimeout(() => setMessage(""), 2500);
  }

  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Choose an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image must be smaller than 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = typeof reader.result === "string" ? reader.result : "";
      setAvatar(image);
      window.localStorage.setItem("northstar_profile_avatar", image);
      setMessage("Profile icon updated");
      window.setTimeout(() => setMessage(""), 2500);
    };
    reader.readAsDataURL(file);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#080a09] pb-32 text-white md:ml-64">
      <header className="border-b border-white/10 bg-[#080a09]/90 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl">
          <button type="button" onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white">
            <ArrowLeft size={17} /> Back
          </button>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c7f36b]">Account</p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
            <button type="button" onClick={logout} className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-400 transition hover:bg-red-400/10 hover:text-red-300">
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0">
              {avatar ? (
                <Image src={avatar} alt="Profile" fill unoptimized className="rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#c7f36b] text-4xl font-bold text-black">
                  {username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-[#101310] bg-white text-black shadow-lg" title="Change profile icon">
                <Camera size={15} />
                <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
              </label>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">Navidrome account</p>
              <h2 className="mt-1 truncate text-2xl font-semibold">{username}</h2>
              <p className="mt-2 text-sm text-zinc-500">Your personal music space</p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <label className="block text-sm font-medium text-zinc-300" htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} maxLength={240} onChange={(event) => setBio(event.target.value)} placeholder="Tell your music world a little about you..." className="mt-3 min-h-32 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-[#c7f36b]" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-600">{bio.length}/240</span>
              <button type="button" onClick={saveProfile} disabled={bio.trim() === savedBio} className="flex items-center gap-2 rounded-lg bg-[#c7f36b] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#dafa96] disabled:cursor-not-allowed disabled:opacity-40"><Save size={16} /> Save bio</button>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <label className="block text-sm font-medium text-zinc-300" htmlFor="playback-quality">
              Playback quality
            </label>
            <p className="mt-1 text-xs leading-5 text-zinc-600">
              Choose once before listening. This applies to the next song and does not interrupt the current track.
            </p>
            <select
              id="playback-quality"
              value={quality}
              onChange={(event) => setQuality(event.target.value as PlaybackQuality)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-200 outline-none focus:border-[#c7f36b]"
            >
              <option value="data-saver" className="bg-zinc-900">Data saver · 96 kbps</option>
              <option value="balanced" className="bg-zinc-900">Balanced · 160 kbps</option>
              <option value="high" className="bg-zinc-900">High quality · 320 kbps</option>
              <option value="original" className="bg-zinc-900">Original · no limit</option>
            </select>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Library</p><h2 className="mt-1 text-xl font-semibold">Your playlists</h2></div>
            <ListMusic size={22} className="text-[#c7f36b]" />
          </div>
          {loading ? <p className="py-8 text-sm text-zinc-500">Loading playlists...</p> : playlists.length === 0 ? <div className="py-8 text-center"><UserRound size={30} className="mx-auto mb-3 text-zinc-700" /><p className="text-sm text-zinc-500">No playlists yet</p></div> : <div className="space-y-1">{playlists.map((playlist) => <button key={playlist.id} type="button" onClick={() => router.push(`/playlists/${playlist.id}`)} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-white/10"><Artwork alt="" coverArt={playlist.coverArt} className="h-10 w-10 shrink-0" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-medium">{playlist.name}</strong><small className="text-xs text-zinc-500">{playlist.songCount ?? 0} songs</small></span></button>)}</div>}
        </section>
      </section>

      {message && <div role="status" className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 text-sm shadow-2xl">{message}</div>}
    </main>
  );
}

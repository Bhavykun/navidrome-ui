"use client";

import {
	Disc3,
	Home,
	ListMusic,
	Music2,
	Search,
	Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const navigation = [
	{ href: "/", label: "Home", icon: Home },
	{ href: "/songs", label: "Songs", icon: Music2 },
	{ href: "/albums", label: "Albums", icon: Disc3 },
	{ href: "/artists", label: "Artists", icon: Users },
	{ href: "/playlists", label: "Playlists", icon: ListMusic },
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
	const pathname = usePathname();
	const router = useRouter();

	return (
		<nav className={mobile ? "grid grid-cols-6 gap-1" : "space-y-1"}>
			{navigation.map(({ href, label, icon: Icon }) => {
				const active = href === "/"
					? pathname === "/"
					: pathname.startsWith(href);

				return (
					<button
						key={href}
						type="button"
						onClick={() => router.push(href)}
						className={mobile
							? `flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] ${active ? "text-white" : "text-zinc-500"}`
							: `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}
					>
						<Icon size={mobile ? 19 : 18} strokeWidth={active ? 2.5 : 2} />
						<span className="truncate">{label}</span>
					</button>
				);
			})}
			{mobile && (
				<button
					type="button"
					onClick={() => router.push("/search")}
					className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] ${pathname.startsWith("/search") ? "text-white" : "text-zinc-500"}`}
				>
					<Search size={19} strokeWidth={pathname.startsWith("/search") ? 2.5 : 2} />
					<span className="truncate">Search</span>
				</button>
			)}
		</nav>
	);
}

export default function Sidebar() {
	const router = useRouter();

	return (
		<>
			<aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#0b0d0c] px-4 py-6 md:block">
				<div className="mb-10 flex items-center gap-3 px-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c7f36b] text-black">
						<Music2 size={20} />
					</div>
					<div>
						<p className="font-semibold tracking-tight text-white">Northstar</p>
						<p className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">Your library</p>
					</div>
				</div>
				<p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Browse</p>
				<Navigation />
				<div className="mt-10 border-t border-white/10 pt-6">
					  <button type="button" onClick={() => router.push("/search")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white">
						<Search size={18} />
						Search
					</button>
				</div>
			</aside>
			<div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0d0c]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
				<Navigation mobile />
			</div>
		</>
	);
}

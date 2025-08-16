import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Send, Globe2, Zap, Sun, Moon, Menu, Plus, Trash2, MessageSquare, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
const Markdown = lazy(() => import("./components/Markdown"));

// --- Config your backend origin here (override with VITE_API_ORIGIN in prod) ---
const API_ORIGIN: string = import.meta.env.VITE_API_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');

interface Message {
	role: "user" | "assistant";
	content: string;
}

interface Conversation {
	id: string;
	title: string;
	messages: Message[];
	createdAt: number;
}

export default function App() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const esRef = useRef<EventSource | null>(null);
	const [theme, setTheme] = useState<"light" | "dark">(() => (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) ? "dark" : "light");
	const [themeOverride, setThemeOverride] = useState<"light" | "dark" | null>(null);
	const [systemDark, setSystemDark] = useState<boolean>(() => (typeof window !== "undefined" && window.matchMedia) ? window.matchMedia("(prefers-color-scheme: dark)").matches : false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [conversations, setConversations] = useState<Conversation[]>(() => {
		try {
			const raw = localStorage.getItem("conversations");
			if (!raw) return [];
			return JSON.parse(raw) as Conversation[];
		} catch {
			return [];
		}
	});
	const [currentId, setCurrentId] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Stable session id per browser
	const sessionId = useMemo(() => {
		const existing = localStorage.getItem("session_id");
		if (existing) return existing;
		const id = uuidv4();
		localStorage.setItem("session_id", id);
		return id;
	}, []);

	useEffect(() => {
		listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
	}, [messages, loading]);

	// Persist conversations
	useEffect(() => {
		localStorage.setItem("conversations", JSON.stringify(conversations));
	}, [conversations]);

	// Theme: initialize override and system preference, migrate legacy key
	useEffect(() => {
		try {
			// Stop honoring legacy key; ensure it doesn't interfere
			localStorage.removeItem("theme");
			const stored = localStorage.getItem("theme_override");
			if (stored === "dark" || stored === "light") {
				setThemeOverride(stored);
			}
			const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
			setSystemDark(!!mql && mql.matches);
			if (mql) {
				const handler = (e: MediaQueryListEvent) => {
					setSystemDark(e.matches);
				};
				const legacyHandler: (this: MediaQueryList, ev: MediaQueryListEvent) => void = function (this: MediaQueryList, ev: MediaQueryListEvent) {
					setSystemDark(ev.matches);
				};
				if (typeof mql.addEventListener === "function") {
					mql.addEventListener("change", handler);
					return () => mql.removeEventListener("change", handler);
				} else if (typeof mql.addListener === "function") {
					mql.addListener(legacyHandler);
					return () => mql.removeListener(legacyHandler);
				}
			}
		} catch {
			// no-op
		}
	}, []);

	// Compute effective theme from override or system
	useEffect(() => {
		const next = themeOverride ?? (systemDark ? "dark" : "light");
		setTheme(next);
	}, [themeOverride, systemDark]);

	// Apply theme to <html>
	useEffect(() => {
		const root = document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [theme]);

	// Persist manual override
	useEffect(() => {
		if (themeOverride) localStorage.setItem("theme_override", themeOverride);
		else localStorage.removeItem("theme_override");
	}, [themeOverride]);

	async function send() {
		const text = input.trim();
		if (!text || loading) return;

		// Optimistic UI: append user message
		setMessages(prev => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

		// Ensure a conversation exists and update it
		setConversations(prev => {
			const existing = currentId ? prev.find(c => c.id === currentId) : undefined;
			const title = (existing?.title ?? text).slice(0, 60);
			if (!existing) {
				const id = uuidv4();
				setCurrentId(id);
				return [
					{ id, title, messages: [{ role: "user", content: text }, { role: "assistant", content: "" }], createdAt: Date.now() },
					...prev,
				];
			}
			return prev.map(c => c.id === currentId ? {
				...c,
				title: c.messages.length === 0 ? title : c.title,
				messages: [...c.messages, { role: "user", content: text }, { role: "assistant", content: "" }],
			} : c);
		});
		setInput("");

		await streamRequest(text);
	}

	// removed non-streaming request; we always stream now

	async function streamRequest(text: string) {
		setLoading(true);
		const streamPath = (API_ORIGIN ? new URL('/api/stream', API_ORIGIN) : new URL('/api/stream', window.location.origin));
		const edgePath = (API_ORIGIN ? new URL('/api/stream', API_ORIGIN) : new URL('/api/stream', window.location.origin));
		// In Vercel production, prefer the Edge Function at /api/stream (same path)
		const url = streamPath;
		url.searchParams.set("message", text);
		url.searchParams.set("session_id", sessionId);

		const es = new EventSource(url.toString());
		esRef.current = es;
		// Only handle explicit "token" events to avoid duplicate appends from default messages
		es.addEventListener("token", (ev) => appendToken((ev as MessageEvent).data));
		es.addEventListener("done", () => {
			es.close();
			esRef.current = null;
			setLoading(false);
		});
		es.onerror = () => {
			es.close();
			esRef.current = null;
			setLoading(false);
		};
	}

	function appendToken(token: string) {
		// Merge token with overlap to prevent duplicated text (e.g., "HereHere")
		function mergeWithOverlap(baseText: string, addition: string): string {
			if (!addition) return baseText;
			let overlap = Math.min(baseText.length, addition.length);
			while (overlap > 0) {
				if (baseText.slice(-overlap) === addition.slice(0, overlap)) break;
				overlap--;
			}
			return baseText + addition.slice(overlap);
		}

		setMessages(prev => {
			const copy = [...prev];
			const last = copy[copy.length - 1];
			if (last && last.role === "assistant") {
				last.content = mergeWithOverlap(last.content, token);
			}
			return copy;
		});

		// Mirror into current conversation
		setConversations(prev => prev.map(c => c.id === currentId ? {
			...c,
			messages: (() => {
				const cm = [...c.messages];
				const last = cm[cm.length - 1];
				if (last && last.role === "assistant") last.content = mergeWithOverlap(last.content, token);
				return cm;
			})()
		} : c));
	}

	function startNewChat() {
		setMessages([]);
		const id = uuidv4();
		setCurrentId(id);
		setConversations(prev => [{ id, title: "New chat", messages: [], createdAt: Date.now() }, ...prev]);
		setSidebarOpen(false);
	}

	function stopStreaming() {
		if (esRef.current) {
			esRef.current.close();
			esRef.current = null;
			setLoading(false);
		}
	}

	function openConversation(id: string) {
		setCurrentId(id);
		const found = conversations.find(c => c.id === id);
		setMessages(found?.messages ?? []);
		setSidebarOpen(false);
	}

	function deleteConversation(id: string) {
		setConversations(prev => prev.filter(c => c.id !== id));
		if (currentId === id) {
			setMessages([]);
			setCurrentId(null);
		}
	}

	function TypingIndicator() {
		return (
			<div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/50 px-2.5 py-1.5 text-zinc-500 dark:text-zinc-400">
				<span className="sr-only">Assistant is typing</span>
				<div className="typing-dots flex items-center">
					<span className="dot" />
					<span className="dot" />
					<span className="dot" />
					<span className="caret" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 selection:bg-zinc-900/10 dark:selection:bg-white/10 pb-24 safe-bottom">
			{/* Header */}
			<header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
				<div className="mx-auto max-w-6xl px-4 py-3 safe-top flex items-center gap-3">
					<button onClick={() => setSidebarOpen(v => !v)} className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700">
						<Menu className="h-4 w-4" />
					</button>
					<div className="h-8 w-8 rounded-2xl grid place-items-center bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
						<Globe2 className="h-4 w-4" />
					</div>
					<div className="flex-1">
						<div className="text-sm font-semibold">Yurie</div>
					</div>
					{loading && (
						<button
							onClick={stopStreaming}
							type="button"
							className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
							title="Stop generating"
						>
							<Loader2 className="h-3.5 w-3.5 animate-spin" /> Stop
						</button>
					)}
					<button
						type="button"
						onClick={() => setThemeOverride(prev => {
							// Cycle: dark -> light -> auto (system) -> dark ...
							if (prev === "dark") return "light";
							if (prev === "light") return null;
							// currently Auto -> lock to the opposite to make the change visible
							return systemDark ? "light" : "dark";
						})}
						className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
						aria-label="Cycle theme (dark → light → system)"
						title={themeOverride ? `Theme: ${themeOverride} (click to cycle)` : `Theme: System (Auto) (click to cycle)`}
					>
						{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
					</button>
				</div>
			</header>

			{sidebarOpen && (
				<div className="fixed inset-0 z-20 md:hidden">
					<div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
					<div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-3 flex flex-col">
						<div className="flex items-center justify-between mb-2">
							<div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Conversations</div>
							<button onClick={startNewChat} className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs">
								<Plus className="h-3.5 w-3.5" /> New
							</button>
						</div>
						<div className="flex-1 overflow-auto space-y-1">
							{conversations.map(c => (
								<div key={c.id} className={`group flex items-center gap-2 rounded-2xl px-2 py-2 cursor-pointer border border-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 ${currentId === c.id ? 'bg-zinc-100/80 dark:bg-zinc-800/60' : ''}`}
									onClick={() => openConversation(c.id)}
								>
									<MessageSquare className="h-4 w-4 text-zinc-500" />
									<div className="flex-1 min-w-0">
										<div className="text-xs truncate">{c.title || 'Untitled'}</div>
									</div>
									<button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60">
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			<div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
				{/* Sidebar */}
				<aside className={`hidden md:flex md:flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 overflow-hidden`}>
					<div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
						<div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Conversations</div>
						<button onClick={startNewChat} className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs">
							<Plus className="h-3.5 w-3.5" /> New chat
						</button>
					</div>
					<div className="flex-1 overflow-auto p-2 space-y-1">
						{conversations.length === 0 && (
							<div className="text-xs text-zinc-500 dark:text-zinc-400 p-3">No conversations yet.</div>
						)}
						{conversations.map(c => (
							<div key={c.id} className={`group flex items-center gap-2 rounded-2xl px-2 py-2 cursor-pointer border border-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 ${currentId === c.id ? 'bg-zinc-100/80 dark:bg-zinc-800/60' : ''}`}
								onClick={() => openConversation(c.id)}
							>
								<MessageSquare className="h-4 w-4 text-zinc-500" />
								<div className="flex-1 min-w-0">
									<div className="text-xs truncate">{c.title || 'Untitled'}</div>
								</div>
								<button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60">
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>
						))}
					</div>
				</aside>

				{/* Chat */}
				<main className="px-0">
					<div ref={listRef} className="space-y-4">
						<AnimatePresence initial={false}>
							{messages.map((m, i) => (
								<motion.div key={i}
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									className={`${
										m.role === 'user'
											? 'bg-white/80 border border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800'
											: 'bg-zinc-100/80 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700'
											}` + " rounded-2xl p-4 transition-colors"}
								>
									<div className="flex items-start gap-3">
										<div className={`h-7 w-7 rounded-lg grid place-items-center ${m.role === 'user' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100'}`}>
											{m.role === 'user' ? 'Y' : 'A'}
										</div>
										<div className="flex-1 min-w-0">
											{m.role === 'assistant' ? (
												<div className="prose prose-zinc dark:prose-invert max-w-none">
													{m.content ? (
														<Suspense fallback={<TypingIndicator />}>
															<Markdown content={m.content} />
														</Suspense>
													) : loading ? (
														<TypingIndicator />
													) : null}
												</div>
											) : (
												<div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
											)}
										</div>
										{m.role === 'assistant' && (
											<button onClick={() => navigator.clipboard.writeText(m.content)} className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Copy message">
												<Copy className="h-3.5 w-3.5" />
											</button>
										)}
									</div>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				</main>
			</div>

			{/* Composer */}
			<div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/90 dark:bg-zinc-900/70 dark:border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-white/70 safe-bottom">
				<form onSubmit={(e) => { e.preventDefault(); send(); }} className="mx-auto max-w-6xl px-4 py-3 flex gap-2 items-center">
					<div className="flex-1 relative">
						<input
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={(e) => {
								if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
									e.preventDefault();
									send();
								}
							}}
							placeholder="Ask me to research something…"
							className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 pr-20 outline-none focus:ring-4 ring-zinc-900/10 dark:ring-white/10 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-base"
						/>
						<div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 flex items-center gap-3">
							{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
							<span className="text-[10px] hidden sm:inline">⌘ Enter</span>
						</div>
					</div>
					<button
						type="submit"
						disabled={loading || !input.trim()}
						className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-3 disabled:opacity-40"
					>
						<Send className="h-4 w-4" /> Send
					</button>
				</form>
			</div>
		</div>
	);
}


"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UserResult {
  id: string;
  name: string;
  image: string | null;
  isFollowing: boolean;
}

function Avatar({ name, image, size = 8 }: { name: string; image: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`w-${size} h-${size} rounded-full border-[2px] border-ink object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`w-${size} h-${size} rounded-full border-[2px] border-ink bg-highlighter text-ink flex items-center justify-center font-[family-name:var(--font-jetbrains-mono)] font-bold text-xs shrink-0`}
    >
      {initials}
    </div>
  );
}

export function FollowWidget({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.users ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleFollow = async (userId: string) => {
    setPendingIds((p) => new Set(p).add(userId));
    try {
      await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: userId }),
      });
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u))
      );
    } finally {
      setPendingIds((p) => { const s = new Set(p); s.delete(userId); return s; });
    }
  };

  const handleUnfollow = async (userId: string) => {
    setPendingIds((p) => new Set(p).add(userId));
    try {
      await fetch("/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: userId }),
      });
      setResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u))
      );
    } finally {
      setPendingIds((p) => { const s = new Set(p); s.delete(userId); return s; });
    }
  };

  return (
    <div className={compact ? "w-full" : "w-full max-w-md mx-auto"}>
      {!compact && (
        <p className="text-sm text-ink/60 font-[family-name:var(--font-space-grotesk)] mb-3">
          Search by name to follow people and see them in your Friends leaderboard.
        </p>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full px-3 py-2 bg-paper text-ink placeholder:text-ink/40 border-[3px] border-ink rounded-[4px] shadow-brutal font-[family-name:var(--font-space-grotesk)] outline-none focus:shadow-[8px_8px_0_var(--ink)] transition-shadow"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/40 font-[family-name:var(--font-jetbrains-mono)]">
            ...
          </span>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {results.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 bg-paper border-[2px] border-ink rounded-[4px] px-3 py-2"
            >
              <Avatar name={u.name} image={u.image} size={8} />
              <span className="flex-1 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-ink truncate">
                {u.name}
              </span>
              {u.isFollowing ? (
                <button
                  onClick={() => handleUnfollow(u.id)}
                  disabled={pendingIds.has(u.id)}
                  className="px-3 py-1 text-xs font-bold font-[family-name:var(--font-space-grotesk)] border-[2px] border-ink rounded-[4px] bg-paper-alt text-ink stamp-press disabled:opacity-50 cursor-pointer"
                >
                  {pendingIds.has(u.id) ? "…" : "Following"}
                </button>
              ) : (
                <button
                  onClick={() => handleFollow(u.id)}
                  disabled={pendingIds.has(u.id)}
                  className="px-3 py-1 text-xs font-bold font-[family-name:var(--font-space-grotesk)] border-[2px] border-ink rounded-[4px] bg-cobalt text-white stamp-press disabled:opacity-50 cursor-pointer shadow-[3px_3px_0_var(--ink)]"
                >
                  {pendingIds.has(u.id) ? "…" : "Follow"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="mt-2 text-sm text-ink/50 font-[family-name:var(--font-jetbrains-mono)]">
          No users found for &quot;{query}&quot;
        </p>
      )}
    </div>
  );
}

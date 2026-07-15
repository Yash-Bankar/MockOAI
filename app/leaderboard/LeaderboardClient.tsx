"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FollowWidget } from "./FollowWidget";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Tab = "week" | "month" | "alltime" | "friends";

interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  score: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  rows: LeaderboardRow[];
  total: number;
  currentUserRank: number | null;
  currentUserRow: LeaderboardRow | null;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "alltime", label: "All Time" },
  { key: "friends", label: "Friends" },
];

const PAGE_SIZE = 50;

/* ─── Avatar helper ──────────────────────────────────────────────────────── */

function Avatar({
  name,
  image,
  size = 10,
}: {
  name: string;
  image: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = `w-${size} h-${size}`;

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={`${sizeClass} rounded-full border-[2px] border-ink object-cover shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full border-[2px] border-ink bg-highlighter text-ink flex items-center justify-center font-[family-name:var(--font-jetbrains-mono)] font-bold text-xs shrink-0`}
    >
      {initials}
    </div>
  );
}

/* ─── Podium card (#1, #2, #3) ───────────────────────────────────────────── */

const podiumStyles: Record<
  1 | 2 | 3,
  { bg: string; text: string; stampVariant: string; border: string; shadow: string }
> = {
  1: {
    bg: "bg-highlighter",
    text: "text-ink",
    stampVariant: "bg-ink text-highlighter",
    border: "border-ink",
    shadow: "shadow-[6px_6px_0_var(--ink)]",
  },
  2: {
    bg: "bg-cobalt",
    text: "text-white",
    stampVariant: "bg-paper text-ink",
    border: "border-ink",
    shadow: "shadow-[6px_6px_0_var(--ink)]",
  },
  3: {
    bg: "bg-paper-alt",
    text: "text-ink",
    stampVariant: "bg-ink text-paper-alt",
    border: "border-ink",
    shadow: "shadow-[6px_6px_0_var(--ink)]",
  },
};

function PodiumCard({
  row,
  isFirst,
}: {
  row: LeaderboardRow;
  isFirst: boolean;
}) {
  const rank = row.rank as 1 | 2 | 3;
  const s = podiumStyles[rank];

  return (
    <div
      className={[
        "flex flex-col items-center gap-3 p-5 border-[3px] rounded-[4px]",
        s.bg,
        s.text,
        s.border,
        s.shadow,
        isFirst ? "py-7" : "",
      ].join(" ")}
    >
      {/* Rank stamp */}
      <div
        className={[
          "inline-flex items-center justify-center",
          "w-10 h-10 rounded-full border-[3px] border-ink",
          "font-[family-name:var(--font-archivo-black)] text-xl",
          s.stampVariant,
        ].join(" ")}
        style={{ transform: `rotate(${rank === 1 ? -3 : rank === 2 ? 2 : -1}deg)` }}
      >
        #{rank}
      </div>

      <Avatar
        name={row.name}
        image={row.image}
        size={isFirst ? 16 : 12}
      />

      <div className="text-center">
        <div
          className={`font-[family-name:var(--font-space-grotesk)] font-bold text-sm ${isFirst ? "text-base" : ""} truncate max-w-[120px]`}
        >
          {row.name}
          {row.isCurrentUser && (
            <span className="ml-1 text-[10px] font-[family-name:var(--font-jetbrains-mono)] opacity-70">
              (you)
            </span>
          )}
        </div>
        <div
          className={`font-[family-name:var(--font-jetbrains-mono)] font-bold ${isFirst ? "text-2xl" : "text-xl"} mt-1`}
        >
          {row.score}
          <span className={`text-xs font-normal ${rank === 2 ? "text-white/50" : "text-ink/40"} ml-1`}>
            /125
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── List row (#4+) ─────────────────────────────────────────────────────── */

function ListRow({ row }: { row: LeaderboardRow }) {
  return (
    <div
      className={[
        "flex items-center gap-4 px-4 py-3 border-[2px] border-ink rounded-[4px]",
        row.isCurrentUser
          ? "bg-highlighter shadow-[3px_3px_0_var(--ink)]"
          : "bg-paper",
      ].join(" ")}
    >
      <span className="w-8 text-center font-[family-name:var(--font-jetbrains-mono)] text-sm font-bold text-ink/50 shrink-0">
        #{row.rank}
      </span>
      <Avatar name={row.name} image={row.image} size={8} />
      <span className="flex-1 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-ink truncate">
        {row.name}
      </span>
      {row.isCurrentUser && (
        <span className="px-2 py-0.5 text-[10px] font-bold font-[family-name:var(--font-jetbrains-mono)] uppercase tracking-wider border-[2px] border-ink rounded-[3px] bg-ink text-highlighter shrink-0">
          You
        </span>
      )}
      <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-bold text-ink shrink-0">
        {row.score}
        <span className="text-xs font-normal text-ink/40 ml-0.5">/125</span>
      </span>
    </div>
  );
}

/* ─── Sticky rank bar ────────────────────────────────────────────────────── */

function StickyRankBar({ row }: { row: LeaderboardRow }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
      <div className="flex items-center gap-4 px-4 py-3 border-[3px] border-ink rounded-[4px] bg-highlighter shadow-[6px_6px_0_var(--ink)]">
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm font-bold text-ink/60 shrink-0">
          Your rank
        </span>
        <span className="font-[family-name:var(--font-jetbrains-mono)] text-lg font-bold text-ink">
          #{row.rank}
        </span>
        <span className="flex-1 font-[family-name:var(--font-space-grotesk)] text-sm font-semibold text-ink truncate">
          {row.name}
        </span>
        <span className="font-[family-name:var(--font-jetbrains-mono)] font-bold text-ink shrink-0">
          {row.score}
          <span className="text-xs font-normal text-ink/40 ml-0.5">/125</span>
        </span>
      </div>
    </div>
  );
}

/* ─── Empty states ───────────────────────────────────────────────────────── */

function EmptyState({ tab }: { tab: Tab }) {
  if (tab === "friends") {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <div
          className="inline-flex items-center justify-center px-6 py-3 border-[3px] border-ink rounded-[4px] bg-paper-alt font-[family-name:var(--font-jetbrains-mono)] font-bold uppercase tracking-wider text-ink"
          style={{ transform: "rotate(-2deg)" }}
        >
          No Friends Yet
        </div>
        <p className="text-ink/60 font-[family-name:var(--font-space-grotesk)] text-sm max-w-sm text-center">
          Follow people to compare scores with them here. Search by name below.
        </p>
        <div className="w-full max-w-md border-[3px] border-ink rounded-[4px] bg-paper p-5 shadow-brutal">
          <p className="font-[family-name:var(--font-archivo-black)] text-base text-ink mb-3">
            Find & Follow
          </p>
          <FollowWidget />
        </div>
      </div>
    );
  }

  const labels: Record<Tab, string> = {
    week: "No completed attempts this week yet.",
    month: "No completed attempts this month yet.",
    alltime: "No completed attempts yet — be the first!",
    friends: "",
  };

  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div
        className="inline-flex items-center justify-center px-6 py-3 border-[3px] border-ink rounded-[4px] bg-paper-alt font-[family-name:var(--font-jetbrains-mono)] font-bold uppercase tracking-wider text-ink"
        style={{ transform: "rotate(2deg)" }}
      >
        Empty
      </div>
      <p className="text-ink/60 font-[family-name:var(--font-space-grotesk)] text-sm max-w-sm text-center">
        {labels[tab]}
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export function LeaderboardClient({
  initialData,
  initialTab,
}: {
  initialData: LeaderboardResponse;
  initialTab: Tab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [rows, setRows] = useState<LeaderboardRow[]>(initialData.rows);
  const [total, setTotal] = useState(initialData.total);
  const [currentUserRank, setCurrentUserRank] = useState(initialData.currentUserRank);
  const [currentUserRow, setCurrentUserRow] = useState(initialData.currentUserRow);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFollowPanel, setShowFollowPanel] = useState(false);

  // Whether the sticky bar should show — only when user's rank is beyond the current page
  const showStickyBar =
    currentUserRow !== null &&
    currentUserRank !== null &&
    currentUserRank > rows.length;

  const fetchLeaderboard = useCallback(
    async (tab: Tab, p: number, append = false) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?tab=${tab}&page=${p}`);
        const data: LeaderboardResponse = await res.json();
        setRows((prev) => (append ? [...prev, ...data.rows] : data.rows));
        setTotal(data.total);
        setCurrentUserRank(data.currentUserRank);
        setCurrentUserRow(data.currentUserRow);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
    setRows([]);
    setShowFollowPanel(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
    fetchLeaderboard(tab, 1, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLeaderboard(activeTab, nextPage, true);
  };

  // Init from URL param on mount only
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const tabParam = (searchParams.get("tab") as Tab) ?? "alltime";
      if (tabParam !== initialTab) {
        setActiveTab(tabParam);
        fetchLeaderboard(tabParam, 1, false);
      }
    }
  }, []);

  const topThree = rows.slice(0, 3);
  const restRows = rows.slice(3);
  const hasMore = rows.length < total;

  return (
    <>
      {/* ─── Tab bar ────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-[3px] border-ink rounded-[4px] overflow-hidden shadow-brutal w-fit">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            onClick={() => handleTabChange(t.key)}
            className={[
              "px-4 py-2 text-sm font-bold font-[family-name:var(--font-space-grotesk)] cursor-pointer",
              "transition-colors",
              i > 0 ? "border-l-[3px] border-ink" : "",
              activeTab === t.key
                ? "bg-ink text-paper"
                : "bg-paper text-ink hover:bg-paper-alt",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Content ────────────────────────────────────────────────── */}
      {loading && rows.length === 0 ? (
        <div className="py-20 text-center font-[family-name:var(--font-jetbrains-mono)] text-ink/40 text-sm">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <>
          {/* Podium: top 3 */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Reorder: 2, 1, 3 for visual podium effect on sm+ */}
              {topThree.length === 1 && (
                <div className="sm:col-start-2">
                  <PodiumCard row={topThree[0]} isFirst={true} />
                </div>
              )}
              {topThree.length === 2 && (
                <>
                  <PodiumCard row={topThree[1]} isFirst={false} />
                  <PodiumCard row={topThree[0]} isFirst={true} />
                </>
              )}
              {topThree.length >= 3 && (
                <>
                  <PodiumCard row={topThree[1]} isFirst={false} />
                  <PodiumCard row={topThree[0]} isFirst={true} />
                  <PodiumCard row={topThree[2]} isFirst={false} />
                </>
              )}
            </div>
          )}

          {/* List rows: rank 4+ */}
          {restRows.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {restRows.map((row) => (
                <ListRow key={row.userId} row={row} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-5 py-2.5 font-[family-name:var(--font-space-grotesk)] font-semibold text-sm border-[3px] border-ink rounded-[4px] bg-paper text-ink shadow-brutal stamp-press disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Loading…" : `Load More (${total - rows.length} remaining)`}
              </button>
            </div>
          )}

          {/* Friends tab: follow panel toggle */}
          {activeTab === "friends" && (
            <div className="mt-6 border-[3px] border-ink rounded-[4px] bg-paper overflow-hidden">
              <button
                onClick={() => setShowFollowPanel((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3 font-[family-name:var(--font-space-grotesk)] font-bold text-sm text-ink bg-paper-alt cursor-pointer"
              >
                <span>Find & Follow More People</span>
                <span
                  className="font-[family-name:var(--font-jetbrains-mono)] text-ink/60 text-xs"
                  style={{
                    transform: showFollowPanel ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 120ms ease",
                    display: "inline-block",
                  }}
                >
                  ▶
                </span>
              </button>
              {showFollowPanel && (
                <div className="px-5 py-4">
                  <FollowWidget compact />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── Sticky rank bar ────────────────────────────────────────── */}
      {showStickyBar && currentUserRow && (
        <StickyRankBar row={currentUserRow} />
      )}
    </>
  );
}

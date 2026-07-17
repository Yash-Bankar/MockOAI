"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MCQQuestion } from "./components/MCQQuestion";
import { CodingQuestion } from "./components/CodingQuestion";
import { Clock } from "lucide-react";

interface SectionConfig {
  id: string;
  name: string;
  order: number;
}

interface ExamClientProps {
  attemptId: string;
  patternName: string;
  durationSeconds: number;
  sections: SectionConfig[];
  startedAt: string; // ISO string
}

export function ExamClient({
  attemptId,
  patternName,
  durationSeconds,
  sections,
  startedAt,
}: ExamClientProps) {
  const router = useRouter();
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  
  const activeSectionIdxRef = useRef(activeSectionIdx);
  const sectionTimesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    activeSectionIdxRef.current = activeSectionIdx;
  }, [activeSectionIdx]);
  
  // Cache of fetched sections
  const [sectionsData, setSectionsData] = useState<Record<string, any>>({});
  const [loadingSection, setLoadingSection] = useState(false);
  const [prefetchingSection, setPrefetchingSection] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  
  // Local state for "Mark for review"
  const [reviewState, setReviewState] = useState<Record<string, boolean>>({});

  // Prevent duplicate prefetch triggers
  const prefetchedSections = useRef(new Set<string>());

  const activeSectionId = sections[activeSectionIdx]?.id;
  const currentSectionData = sectionsData[activeSectionId];

  // 1. Timer Logic
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeLeft(remaining);
      
      const currentSectionId = sections[activeSectionIdxRef.current]?.id;
      if (currentSectionId) {
        sectionTimesRef.current[currentSectionId] = (sectionTimesRef.current[currentSectionId] || 0) + 1;
      }
      
      if (remaining <= 0) {
        clearInterval(interval);
        handleExamSubmit(true); // Auto-submit
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationSeconds]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isDangerTime = timeLeft < 120; // less than 2 mins

  // 2. Fetch Section Data
  const loadSection = useCallback(async (sectionId: string, idx: number) => {
    if (sectionsData[sectionId]) {
      setActiveSectionIdx(idx);
      setActiveQuestionIdx(0);
      return;
    }

    setLoadingSection(true);
    try {
      const res = await fetch(`/api/exam/${attemptId}/sections/${sectionId}`);
      if (res.status === 404) {
        // Not generated yet? Trigger generate synchronously as fallback
        await generateSection(sectionId);
        const retryRes = await fetch(`/api/exam/${attemptId}/sections/${sectionId}`);
        const data = await retryRes.json();
        setSectionsData(prev => ({ ...prev, [sectionId]: data }));
      } else {
        const data = await res.json();
        setSectionsData(prev => ({ ...prev, [sectionId]: data }));
      }
      setActiveSectionIdx(idx);
      setActiveQuestionIdx(0);
    } catch (err) {
      console.error(err);
      alert("Failed to load section");
    } finally {
      setLoadingSection(false);
    }
  }, [attemptId, sectionsData]);

  // Initial load
  useEffect(() => {
    if (sections.length > 0 && !sectionsData[sections[0].id]) {
      loadSection(sections[0].id, 0);
    }
  }, [sections, loadSection, sectionsData]);

  // 3. Prefetch Next Section (Background)
  const generateSection = async (sectionId: string) => {
    await fetch(`/api/exam/${attemptId}/sections/${sectionId}/generate`, { method: "POST" });
  };

  useEffect(() => {
    // If we have loaded the current section, prefetch the next one if it exists and isn't cached
    const nextSection = sections[activeSectionIdx + 1];
    if (currentSectionData && nextSection && !sectionsData[nextSection.id] && !prefetchedSections.current.has(nextSection.id)) {
      prefetchedSections.current.add(nextSection.id);
      setPrefetchingSection(true);
      // Fire and forget generate
      generateSection(nextSection.id)
        .catch(console.error)
        .finally(() => setPrefetchingSection(false));
    }
  }, [activeSectionIdx, currentSectionData, sections, sectionsData]);

  // 4. Save Answer (Debounced in child components, so this is just the fetch)
  const handleSaveAnswer = async (questionId: string, payload: any) => {
    try {
      await fetch(`/api/exam/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, ...payload }),
      });
      // Update local cache
      setSectionsData(prev => {
        const updated = { ...prev };
        const section = updated[activeSectionId];
        if (section) {
          const q = section.questions.find((q: any) => q.id === questionId);
          if (q) {
            if (!q.submission) q.submission = {};
            Object.assign(q.submission, payload);
          }
        }
        return updated;
      });
    } catch (err) {
      console.error("Failed to save answer", err);
    }
  };

  const toggleReview = (questionId: string) => {
    setReviewState(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSectionSubmit = () => {
    if (confirm(`Submit section "${sections[activeSectionIdx].name}"? You can't return to it later.`)) {
      if (activeSectionIdx < sections.length - 1) {
        loadSection(sections[activeSectionIdx + 1].id, activeSectionIdx + 1);
      } else {
        handleExamSubmit();
      }
    }
  };

  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  const handleExamSubmit = async (isAuto = false) => {
    if (!isAuto && !confirm("Are you sure you want to submit the entire exam? This cannot be undone.")) {
      return;
    }

    if (isAuto) alert("Time is up! Submitting your exam now...");

    setIsSubmittingExam(true);
    try {
      // Step 1: Finalize scores — this ALWAYS runs and NEVER throws on Gemini failure
      const completeRes = await fetch(`/api/exam/${attemptId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionTimes: sectionTimesRef.current }),
      });

      if (!completeRes.ok) {
        const errData = await completeRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to complete exam");
      }


      router.push(`/exam/${attemptId}/results`);
    } catch (err) {
      console.error("[ExamClient] Exam submission error:", err);
      alert(`Submission failed: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`);
    } finally {
      setIsSubmittingExam(false);
    }
  };


  if (loadingSection && !currentSectionData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--exam-bg)]">
        <div className="text-[var(--exam-text-muted)] animate-pulse">Loading section...</div>
      </div>
    );
  }

  if (!currentSectionData) return null;

  const questions = currentSectionData.questions || [];
  const currentQ = questions[activeQuestionIdx];

  // Palette State Calculation
  const getPaletteState = (q: any) => {
    if (reviewState[q.id]) return "review";
    if (q.type === "MCQ" && q.submission?.selectedOptionId) return "answered";
    if (q.type === "CODING" && q.submission?.code && q.submission.code.trim().length > 10) return "answered";
    return "unanswered";
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--exam-bg)] text-[var(--exam-text)] font-sans">
      {/* ── Top Bar ── */}
      <header className="flex-shrink-0 bg-white border-b border-[var(--exam-border)] flex items-center justify-between px-6 h-16 shadow-[var(--shadow-exam)] relative z-10">
        <div className="flex items-center gap-4 h-full">
          <div className="font-bold text-lg border-r border-[var(--exam-border)] pr-4 py-2">
            MockOAI
          </div>
          {/* Section Tabs */}
          <nav className="flex items-center h-full space-x-1">
            {sections.map((sec, idx) => {
              const isActive = idx === activeSectionIdx;
              const isLocked = idx > activeSectionIdx && !sectionsData[sec.id];
              return (
                <button
                  key={sec.id}
                  disabled={isLocked || idx < activeSectionIdx} // Simplistic progression: can't go back once submitted
                  onClick={() => loadSection(sec.id, idx)}
                  className={`h-full px-4 border-b-2 text-sm font-medium transition-colors
                    ${isActive ? "border-[var(--exam-accent)] text-[var(--exam-accent)]" : "border-transparent text-[var(--exam-text-muted)]"}
                    ${(isLocked || idx < activeSectionIdx) ? "opacity-50 cursor-not-allowed" : "hover:text-[var(--exam-text)] hover:bg-gray-50"}
                  `}
                >
                  {sec.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {prefetchingSection && (
            <span className="text-xs text-[var(--exam-text-muted)] animate-pulse flex items-center gap-2">
              Preparing next section...
            </span>
          )}
          <div className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1.5 rounded-[var(--radius-exam)] ${isDangerTime ? 'text-[var(--exam-danger)] bg-red-50' : 'text-[var(--exam-text)] bg-gray-100'}`}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left/Main: Question Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {currentQ && (
            <div className="flex-1 min-h-0">
              {currentQ.type === "MCQ" ? (
                <MCQQuestion
                  questionId={currentQ.id}
                  promptText={currentQ.promptText}
                  options={currentQ.options}
                  initialSelectedId={currentQ.submission?.selectedOptionId || null}
                  isFirst={activeQuestionIdx === 0}
                  isLast={activeQuestionIdx === questions.length - 1}
                  onNext={() => setActiveQuestionIdx(i => i + 1)}
                  onPrev={() => setActiveQuestionIdx(i => i - 1)}
                  onSave={(qId, optId) => handleSaveAnswer(qId, { selectedOptionId: optId })}
                  isReviewMode={!!reviewState[currentQ.id]}
                  onToggleReview={() => toggleReview(currentQ.id)}
                />
              ) : (
                <CodingQuestion
                  questionId={currentQ.id}
                  attemptId={attemptId}
                  promptText={currentQ.promptText}
                  codingMeta={currentQ.codingMeta}
                  initialCode={currentQ.submission?.code || null}
                  initialLanguage={currentQ.submission?.language || null}
                  onSave={(qId, code, language) => handleSaveAnswer(qId, { code, language })}
                />
              )}
            </div>
          )}
        </div>

        {/* Right: Question Palette & Section Submit */}
        <aside className="w-72 bg-white border-l border-[var(--exam-border)] flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)] z-0">
          <div className="p-4 border-b border-[var(--exam-border)] bg-[var(--exam-bg)]">
            <h2 className="font-semibold text-sm">Question Palette</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--exam-text-muted)]">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[var(--exam-success)]"></span> Answered</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border border-[var(--exam-border)]"></span> Unanswered</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Review</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q: any, i: number) => {
                const state = getPaletteState(q);
                const isActive = i === activeQuestionIdx;
                
                let stateClass = "bg-white border-[var(--exam-border)] text-[var(--exam-text)]";
                if (state === "answered") stateClass = "bg-[var(--exam-success)] border-[var(--exam-success)] text-white";
                if (state === "review") stateClass = "bg-purple-500 border-purple-500 text-white";
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIdx(i)}
                    className={`
                      w-10 h-10 rounded text-sm font-medium border flex items-center justify-center transition-all
                      ${stateClass}
                      ${isActive ? "ring-2 ring-offset-1 ring-[var(--exam-accent)]" : "hover:brightness-95"}
                    `}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-[var(--exam-border)] bg-[var(--exam-bg)] space-y-3">
            <div className="text-xs text-center text-[var(--exam-text-muted)]">
              {activeSectionIdx < sections.length - 1 
                ? "Once submitted, you cannot return to this section."
                : "Submit the entire exam for evaluation."}
            </div>
            <button
              onClick={activeSectionIdx < sections.length - 1 ? handleSectionSubmit : () => handleExamSubmit(false)}
              disabled={isSubmittingExam}
              className="w-full py-2.5 px-4 bg-[var(--exam-accent)] hover:bg-blue-700 text-white font-medium text-sm rounded-[var(--radius-exam)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmittingExam
                ? "Submitting..."
                : activeSectionIdx < sections.length - 1 ? "Submit Section" : "Submit Exam"}
            </button>
          </div>
        </aside>

      </main>
    </div>
  );
}

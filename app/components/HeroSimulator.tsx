"use client";

import { useState, useEffect } from "react";
import { Card, Badge, GradeStamp } from "@/components/ui";
import { Play, Terminal, CheckCircle2, RotateCcw, Cpu } from "lucide-react";

type Stage = "idle" | "simulating" | "submitting" | "results";

const MOCK_SECTIONS = [
  { name: "English", score: 18, max: 20, color: "bg-cobalt" },
  { name: "Reasoning", score: 16, max: 20, color: "bg-cobalt" },
  { name: "Quant", score: 14, max: 20, color: "bg-highlighter" },
  { name: "CS Fundamentals", score: 18, max: 20, color: "bg-pass-green" },
  { name: "Coding", score: 40, max: 45, color: "bg-pass-green" },
];

export default function HeroSimulator() {
  const [stage, setStage] = useState<Stage>("idle");
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [codeText, setCodeText] = useState("");
  const [testCases, setTestCases] = useState<string[]>([]);
  const [barWidths, setBarWidths] = useState<number[]>([0, 0, 0, 0, 0]);

  const targetCode = `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i`;

  // Start simulation
  const startSimulation = () => {
    setStage("simulating");
    setCurrentSectionIdx(0);
    setProgress(0);
    setCodeText("");
    setTestCases([]);
    setBarWidths([0, 0, 0, 0, 0]);
  };

  // Simulating section progression
  useEffect(() => {
    if (stage !== "simulating") return;

    if (currentSectionIdx < 4) {
      // Simulate MCQ sections quickly
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setCurrentSectionIdx((idx) => idx + 1);
            return 0;
          }
          return prev + 25;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      // Coding section simulation with typewriter effect and test cases
      let charIndex = 0;
      const codeInterval = setInterval(() => {
        if (charIndex < targetCode.length) {
          setCodeText((prev) => prev + targetCode[charIndex]);
          charIndex += 4; // Type 4 characters at a time for speed
        } else {
          clearInterval(codeInterval);
          // Run test cases sequentially
          setTimeout(() => {
            setTestCases((prev) => [...prev, "Test Case 1: PASS ✓"]);
            setTimeout(() => {
              setTestCases((prev) => [...prev, "Test Case 2: PASS ✓"]);
              setTimeout(() => {
                setTestCases((prev) => [...prev, "Test Case 3: PASS ✓"]);
                setTimeout(() => {
                  setStage("submitting");
                }, 850);
              }, 400);
            }, 400);
          }, 400);
        }
      }, 50);

      return () => clearInterval(codeInterval);
    }
  }, [stage, currentSectionIdx]);

  // Submitting transition
  useEffect(() => {
    if (stage !== "submitting") return;
    const timer = setTimeout(() => {
      setStage("results");
    }, 1500);
    return () => clearTimeout(timer);
  }, [stage]);

  // Animate result bars in results stage
  useEffect(() => {
    if (stage !== "results") return;
    const timer = setTimeout(() => {
      setBarWidths(MOCK_SECTIONS.map((s) => Math.round((s.score / s.max) * 100)));
    }, 100);
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div className="w-full max-w-sm">
      {stage === "idle" && (
        <Card className="w-full h-[400px] flex flex-col justify-between" tilt={-1.5}>
          <div>
            <div className="flex items-center gap-2 mb-4 border-b-2 border-ink pb-2">
              <Terminal size={18} className="text-ink" />
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs font-bold text-ink">
                MOCK_OA_SIMULATOR_v1.0
              </span>
            </div>
            <div className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-ink/75 leading-relaxed space-y-2">
              <p className="text-cobalt font-bold">&gt; INITIALIZING SIMULATION...</p>
              <p>&gt; PATTERN: TCS NQT-STYLE OA</p>
              <p>&gt; TOTAL SECTIONS: 5 SECTIONS</p>
              <p>&gt; MAXIMUM SCORE: 125 MARKS</p>
              <p>&gt; TIME LIMIT: 120 MINUTES</p>
              <p className="pt-2 text-ink/50">
                Witness a simulated mock OA attempt. We will answer English,
                Reasoning, Quant, and CS MCQ questions, compile Python code for
                a Coding problem, execute sandbox test cases, and analyze the score.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={startSimulation}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 font-[family-name:var(--font-space-grotesk)] font-bold text-base border-[3px] border-ink rounded-[4px] bg-highlighter text-ink shadow-brutal stamp-press cursor-pointer hover:bg-highlighter/90"
            >
              <Play size={16} fill="currentColor" /> Run Mock Simulator
            </button>
          </div>
        </Card>
      )}

      {stage === "simulating" && (
        <Card className="w-full h-[400px] flex flex-col justify-between bg-ink text-paper" tilt={1}>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between border-b border-paper/20 pb-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-pen animate-ping" />
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs font-bold">
                  SIMULATING ATTEMPT...
                </span>
              </div>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-highlighter">
                Section {currentSectionIdx + 1}/5
              </span>
            </div>

            {currentSectionIdx < 4 ? (
              <div className="space-y-4 font-[family-name:var(--font-jetbrains-mono)] text-xs">
                <p className="text-paper/60">&gt; Loading question data...</p>
                <p>&gt; Active Section: <span className="text-highlighter font-bold">{MOCK_SECTIONS[currentSectionIdx].name}</span></p>
                <div className="space-y-1">
                  <p className="text-paper/40">Solving questions (MCQ)...</p>
                  <div className="w-full h-3 bg-paper/10 border border-paper/20 rounded-[2px] overflow-hidden">
                    <div
                      className="h-full bg-highlighter transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-[family-name:var(--font-jetbrains-mono)] text-xs">
                <p className="text-paper/60">&gt; Active Section: <span className="text-pass-green font-bold">Coding</span></p>
                <p className="text-paper/40">&gt; Writing Two Sum solution in Python...</p>
                <pre className="p-2 bg-paper/5 border border-paper/10 rounded-[2px] text-[10px] leading-tight text-highlighter overflow-y-auto max-h-[140px] font-mono whitespace-pre">
                  {codeText}
                </pre>
                <div className="space-y-1 text-[10px]">
                  {testCases.map((tc, idx) => (
                    <p key={idx} className="text-pass-green flex items-center gap-1 font-bold">
                      <CheckCircle2 size={10} /> {tc}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-paper/30 font-[family-name:var(--font-jetbrains-mono)] border-t border-paper/10 pt-2">
            Do not refresh. Sandboxed Piston environment is running...
          </div>
        </Card>
      )}

      {stage === "submitting" && (
        <Card className="w-full h-[400px] flex flex-col items-center justify-center text-center" tilt={-1}>
          <Cpu className="text-cobalt animate-spin mb-4" size={48} />
          <h3 className="font-[family-name:var(--font-archivo-black)] text-lg text-ink mb-1">
            Submitting OA Attempt
          </h3>
          <p className="text-xs text-ink/50 font-[family-name:var(--font-jetbrains-mono)] animate-pulse max-w-[250px]">
            Compiling results, grading submissions, and generating AI insights...
          </p>
        </Card>
      )}

      {stage === "results" && (
        <Card className="w-full min-h-[400px] flex flex-col justify-between relative" tilt={-1.5}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-archivo-black)] text-lg text-ink">
                Simulated Result
              </h3>
              <GradeStamp variant="pass" rotate={3}>
                PASS
              </GradeStamp>
            </div>

            {/* Total score */}
            <div className="flex items-baseline gap-2 mb-5">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-4xl font-bold text-ink">
                106
              </span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-lg text-ink/40">
                / 125
              </span>
              <Badge variant="success" className="ml-2">Top 8%</Badge>
            </div>

            {/* Section bars */}
            <div className="flex flex-col gap-2.5">
              {MOCK_SECTIONS.map((section, idx) => (
                <div key={section.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold text-ink font-[family-name:var(--font-space-grotesk)]">
                      {section.name}
                    </span>
                    <span className="text-[11px] font-bold text-ink font-[family-name:var(--font-jetbrains-mono)]">
                      {section.score}/{section.max}
                    </span>
                  </div>
                  <div className="h-2.5 bg-ink/10 rounded-[2px] border border-ink/20 overflow-hidden">
                    <div
                      className={`h-full ${section.color} rounded-[1px] transition-all duration-1000 ease-out`}
                      style={{ width: `${barWidths[idx]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI Insight Box */}
            <div className="mt-4 p-2.5 bg-paper-alt border-[2px] border-ink rounded-[4px] font-[family-name:var(--font-space-grotesk)] text-xs text-ink/80 leading-snug">
              <span className="font-bold text-cobalt font-[family-name:var(--font-jetbrains-mono)] block mb-0.5">
                ✦ AI INSIGHT:
              </span>
              Excellent Coding and English! Spend a bit more time studying Quant (Averages/Ratios) to push for the top 3%. APP MUMBAI AA SAKTE HO!!
            </div>
          </div>

          {/* Footer controls */}
          <div className="mt-4 pt-3 border-t-[2px] border-ink/10 flex items-center justify-between">
            <span className="text-[10px] text-ink/45 font-[family-name:var(--font-space-grotesk)]">
              Simulated just now
            </span>
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold font-[family-name:var(--font-space-grotesk)] border-[2px] border-ink rounded-[4px] bg-paper text-ink hover:bg-paper-alt stamp-press cursor-pointer"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

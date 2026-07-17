"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Play, Send, CheckCircle2, XCircle } from "lucide-react";

interface CodingQuestionProps {
  questionId: string;
  attemptId: string;
  promptText: string;
  codingMeta: {
    constraints: string[];
    examples: { input: string; output: string; explanation?: string }[];
    starterCode: Record<string, string>;
    timeLimitMs?: number;
  };
  initialCode: string | null;
  initialLanguage: string | null;
  onSave: (questionId: string, code: string, language: string) => void;
}

export function CodingQuestion({
  questionId,
  attemptId,
  promptText,
  codingMeta,
  initialCode,
  initialLanguage,
  onSave,
}: CodingQuestionProps) {
  const languages = ["python", "cpp", "java", "javascript"];
  const [language, setLanguage] = useState<string>(initialLanguage || "python");
  const [code, setCode] = useState<string>(initialCode || codingMeta.starterCode[language] || "");
  
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState<any[] | null>(null);

  // Autosave timeout ref
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset local state when question changes
  useEffect(() => {
    const lang = initialLanguage || "python";
    setLanguage(lang);
    setCode(initialCode || codingMeta.starterCode[lang] || "");
    setRunResults(null);
  }, [questionId, initialCode, initialLanguage, codingMeta.starterCode]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    const newCode = codingMeta.starterCode[newLang] || "";
    setCode(newCode);
    onSave(questionId, newCode, newLang);
  };

  const handleCodeChange = (newCode: string | undefined) => {
    const value = newCode || "";
    setCode(value);
    
    // Debounce save
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onSave(questionId, value, language);
    }, 1000);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setRunResults(null);
    try {
      const res = await fetch(`/api/exam/${attemptId}/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, code, language }),
      });
      const data = await res.json();
      if (data.success && data.results) {
        setRunResults(data.results);

        // Build alert popup with per-test-case detail
        const { passed, total, results } = data;
        let msg = `Run Complete: ${passed}/${total} test cases passed`;
        (results as any[]).forEach((tc: any, idx: number) => {
          msg += `\n\n[Test Case ${idx + 1}] ${tc.passed ? "✅ Passed" : "❌ Failed"}`;
          msg += `\nInput:\n${tc.input ?? "N/A"}`;
          msg += `\nYour Output:\n${tc.actualOutput || "(no output)"}`;
        });
        alert(msg);
      } else {
        alert(data.error || "Run failed");
      }
    } catch (err) {
      alert("Failed to connect to run server.");
    } finally {
      setIsRunning(false);
    }
  };


  const handleSubmit = async () => {
    if (!confirm("Submit this code? This will grade against hidden test cases and cannot be undone.")) {
      return;
    }
    setIsSubmitting(true);
    setRunResults(null);
    try {
      const res = await fetch(`/api/exam/${attemptId}/code/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, code, language }),
      });
      const data = await res.json();
      if (data.success) {
        let msg = `Submitted successfully!\nScore: ${data.scoreAwarded}`;
        if (data.aiFeedback) {
          msg += `\n\nAI Feedback:\n${data.aiFeedback}`;
        }
        
        const failedVisible = data.results?.filter((r: any) => !r.passed) || [];
        if (failedVisible.length > 0) {
          msg += `\n\nFailed Visible Test Cases:`;
          failedVisible.forEach((tc: any, idx: number) => {
            msg += `\n\n[Failed Test Case ${idx + 1}]\nInput:\n${tc.input || 'N/A'}\nExpected Output:\n${tc.expectedOutput || 'N/A'}\nActual Output:\n${tc.actualOutput || 'N/A'}`;
          });
        }
        
        alert(msg);

        if (data.results) {
          setRunResults(data.results);
        }
      } else {
        alert(data.error || "Submit failed");
      }
    } catch (err) {
      alert("Failed to submit code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full rounded-lg border border-[var(--exam-border)] shadow-[var(--shadow-exam)] overflow-hidden bg-white">
      {/* Left Pane: Problem Description */}
      <div className="w-full lg:w-1/2 flex flex-col border-r border-[var(--exam-border)] h-full overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--exam-border)] bg-[var(--exam-bg)]">
          <h3 className="font-semibold text-lg text-[var(--exam-text)]">Problem Statement</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          <div className="prose prose-sm max-w-none text-[var(--exam-text)]">
            <p className="whitespace-pre-wrap">{promptText}</p>
          </div>
          
          {codingMeta.examples && codingMeta.examples.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-[var(--exam-text)]">Examples</h4>
              {codingMeta.examples.map((ex, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-[var(--radius-exam)] border border-[var(--exam-border)]">
                  <p className="text-sm font-medium mb-1 text-[var(--exam-text)]">Input:</p>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200 text-gray-800">{ex.input}</pre>
                  <p className="text-sm font-medium mb-1 mt-3 text-[var(--exam-text)]">Output:</p>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200 text-gray-800">{ex.output}</pre>
                  {ex.explanation && (
                    <p className="text-xs mt-2 text-[var(--exam-text-muted)]"><span className="font-semibold">Explanation:</span> {ex.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {codingMeta.constraints && codingMeta.constraints.length > 0 && (
            <div>
              <h4 className="font-semibold text-[var(--exam-text)] mb-2">Constraints</h4>
              <ul className="list-disc pl-5 text-sm text-[var(--exam-text-muted)] space-y-1">
                {codingMeta.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Editor & Console */}
      <div className="w-full lg:w-1/2 flex flex-col h-full bg-[#1e1e1e]">
        {/* Editor Header */}
        <div className="px-4 py-2 border-b border-gray-800 bg-[#252526] flex items-center justify-between">
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="bg-[#3c3c3c] text-gray-200 text-sm border-none rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {languages.map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors disabled:opacity-50 min-w-[72px] justify-center"
            >
              {isRunning ? (
                <><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />Running…</>
              ) : (
                <><Play className="w-3.5 h-3.5" />Run</>
              )}
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors disabled:opacity-50 min-w-[88px] justify-center"
            >
              {isSubmitting ? (
                <><span className="w-2 h-2 rounded-full bg-white animate-pulse inline-block" />Submitting…</>
              ) : (
                <><Send className="w-3.5 h-3.5" />Submit</>
              )}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === 'c++' ? 'cpp' : language}
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              padding: { top: 16 },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {/* Console Panel: shows while executing OR when there are run results */}
        {(isRunning || isSubmitting || runResults) && (
          <div className="h-1/3 min-h-[200px] border-t border-gray-800 bg-[#1e1e1e] flex flex-col">
            <div className="px-4 py-2 border-b border-gray-800 bg-[#252526] flex items-center justify-between">
              <span className="text-gray-300 text-xs font-semibold">
                {isRunning ? "Running…" : isSubmitting ? "Submitting…" : "Test Results"}
              </span>
              {runResults && !isRunning && !isSubmitting && (
                <button onClick={() => setRunResults(null)} className="text-gray-500 hover:text-gray-300 text-xs">Clear</button>
              )}
            </div>

            {/* Executing placeholder */}
            {(isRunning || isSubmitting) && !runResults ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500">
                <div className="flex gap-1.5 items-end">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce inline-block"
                      style={{ animationDelay: `${i * 150}ms`, animationDuration: "700ms" }}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono">
                  {isRunning ? "Executing against visible test cases…" : "Grading against hidden test cases…"}
                </span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(runResults || []).map((res: any, i: number) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${res.passed ? "text-green-400" : "text-red-400"}`}>
                        Test Case {i + 1}
                      </span>
                    </div>
                    <div className="bg-[#111111] border border-gray-800 rounded p-2 text-xs font-mono text-gray-300 whitespace-pre-wrap">
                      <span className="text-gray-500 block mb-1">Input:</span>
                      {res.input || "No input"}
                    </div>
                    <div className="bg-[#111111] border border-gray-800 rounded p-2 text-xs font-mono text-gray-300 whitespace-pre-wrap">
                      <span className="text-gray-500 block mb-1">Actual Output:</span>
                      {res.actualOutput || "No output"}
                    </div>
                    {!res.passed && res.expectedOutput && (
                      <div className="bg-[#111111] border border-gray-800 rounded p-2 text-xs font-mono text-gray-300 whitespace-pre-wrap opacity-80">
                        <span className="text-gray-500 block mb-1">Expected Output:</span>
                        {res.expectedOutput}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

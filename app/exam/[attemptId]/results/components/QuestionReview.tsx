"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

interface QuestionReviewProps {
  sections: any[];
}

export function QuestionReview({ sections }: QuestionReviewProps) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedQ(prev => prev === id ? null : id);
  };

  return (
    <div className="mb-12">
      <h3 className="font-black text-2xl uppercase tracking-widest mb-6 border-b-4 border-black pb-2 inline-block">
        Review Answers
      </h3>

      <div className="space-y-8">
        {sections.map((section, sIdx) => (
          <div key={section.id} className="bg-white border-4 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)]">
            <div className="bg-black text-white p-4 font-bold text-lg flex justify-between items-center">
              <span>Part {sIdx + 1}: {section.name}</span>
              <span>{section.scoreObtained ?? 0} / {section.maxScore} pts</span>
            </div>

            <div className="p-0">
              {section.questions.map((q: any, qIdx: number) => {
                const isExpanded = expandedQ === q.id;
                const isCorrect = q.submission?.isCorrect;

                return (
                  <div key={q.id} className="border-b-2 border-black last:border-0">
                    <button
                      onClick={() => toggle(q.id)}
                      className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <span className="font-bold w-6">{qIdx + 1}.</span>
                        <div className="flex flex-col">
                          <span className="font-medium line-clamp-1">{q.promptText}</span>
                          <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{q.subType}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="font-bold text-sm">
                          {q.submission?.scoreAwarded ?? 0} / {q.maxScore}
                        </span>
                        {isCorrect ? (
                          <CheckCircle className="text-[#00E676]" size={24} />
                        ) : (
                          <XCircle className="text-[#FF4081]" size={24} />
                        )}
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-6 bg-gray-50 border-t-2 border-black text-sm">
                        <div className="mb-6">
                          <h4 className="font-bold mb-2 uppercase text-xs tracking-widest text-gray-500">Question</h4>
                          <p className="whitespace-pre-wrap">{q.promptText}</p>
                        </div>

                        {q.type === "MCQ" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-bold mb-2 uppercase text-xs tracking-widest text-gray-500">Your Answer</h4>
                              <div className={`p-3 border-2 border-black ${isCorrect ? 'bg-[#00E676]/20' : 'bg-[#FF4081]/20'}`}>
                                {q.options?.find((o: any) => o.id === q.submission?.selectedOptionId)?.text || "No Answer"}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold mb-2 uppercase text-xs tracking-widest text-gray-500">Correct Answer</h4>
                              <div className="p-3 border-2 border-black bg-[#00E676]/20">
                                {q.options?.find((o: any) => o.id === q.correctOptionId)?.text}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <h4 className="font-bold mb-2 uppercase text-xs tracking-widest text-gray-500">Explanation</h4>
                              <p className="whitespace-pre-wrap bg-white p-4 border-2 border-black">{q.explanation}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-bold mb-2 uppercase text-xs tracking-widest text-gray-500">AI Feedback</h4>
                              <div className="p-4 border-2 border-black bg-blue-50 whitespace-pre-wrap">
                                {q.submission?.aiFeedback || "No AI feedback generated."}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold mb-2 uppercase text-xs tracking-widest text-gray-500">Test Case Results</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {Array.isArray(q.submission?.testCaseResults)
                                  ? q.submission?.testCaseResults.map((tc: any, idx: number) => (
                                    <div key={idx} className={`p-2 border-2 border-black text-center font-bold ${tc.passed ? 'bg-[#00E676]' : 'bg-[#FF4081] text-white'}`}>
                                      Test {idx + 1}: {tc.passed ? 'PASS' : 'FAIL'}
                                    </div>
                                  ))
                                  : (
                                    <>
                                      {(q.submission?.testCaseResults as any)?.visible?.map((tc: any, idx: number) => (
                                        <div key={`vis-${idx}`} className={`p-2 border-2 border-black text-center font-bold ${tc.passed ? 'bg-[#00E676]' : 'bg-[#FF4081] text-white'}`}>
                                          Vis {idx + 1}: {tc.passed ? 'PASS' : 'FAIL'}
                                        </div>
                                      ))}
                                      {(q.submission?.testCaseResults as any)?.hiddenSummary?.map((tc: any, idx: number) => (
                                        <div key={`hid-${idx}`} className={`p-2 border-2 border-black text-center font-bold ${tc.status === 'Passed' ? 'bg-[#00E676]' : 'bg-[#FF4081] text-white'}`}>
                                          Hid {idx + 1}: {tc.status === 'Passed' ? 'PASS' : 'FAIL'}
                                        </div>
                                      ))}
                                    </>
                                  )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-bold mb-2 uppercase text-xs tracking-widest text-gray-500">Your Code</h4>
                              <pre className="p-4 border-2 border-black bg-black text-[#00E676] overflow-x-auto text-xs">
                                <code>{q.submission?.code || "// No code submitted"}</code>
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

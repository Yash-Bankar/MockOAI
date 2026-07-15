"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";

interface MCQOption {
  id: string;
  text: string;
}

interface MCQQuestionProps {
  questionId: string;
  promptText: string;
  options: MCQOption[];
  initialSelectedId: string | null;
  onSave: (questionId: string, optionId: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  isFirst: boolean;
  isLast: boolean;
  isReviewMode?: boolean; // For Mark for Review feature
  onToggleReview?: () => void;
}

export function MCQQuestion({
  questionId,
  promptText,
  options,
  initialSelectedId,
  onSave,
  onNext,
  onPrev,
  isFirst,
  isLast,
  isReviewMode,
  onToggleReview,
}: MCQQuestionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);

  // Sync state if initialSelectedId changes (e.g. user navigating back and forth)
  useEffect(() => {
    setSelectedId(initialSelectedId);
  }, [initialSelectedId, questionId]);

  const handleSelect = (optionId: string) => {
    setSelectedId(optionId);
    onSave(questionId, optionId);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-[var(--exam-border)] shadow-[var(--shadow-exam)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--exam-border)] flex items-center justify-between bg-[var(--exam-bg)]">
        <h3 className="font-semibold text-lg text-[var(--exam-text)]">Question</h3>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--exam-text-muted)] hover:text-[var(--exam-text)] select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-[var(--exam-border)] text-[var(--exam-accent)] focus:ring-[var(--exam-accent)]"
            checked={isReviewMode}
            onChange={onToggleReview}
          />
          Mark for review
        </label>
      </div>

      {/* Prompt Area */}
      <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-white">
        <div className="prose prose-sm md:prose-base max-w-none mb-8 text-[var(--exam-text)]">
          <p className="whitespace-pre-wrap">{promptText}</p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {options?.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left p-4 rounded-[var(--radius-exam)] border transition-all duration-200 flex items-start gap-4
                  ${
                    isSelected
                      ? "border-[var(--exam-accent)] bg-[var(--exam-accent)]/5 ring-1 ring-[var(--exam-accent)]"
                      : "border-[var(--exam-border)] hover:border-[var(--exam-text-muted)] bg-white"
                  }
                `}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--exam-accent)]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--exam-text-muted)] opacity-50" />
                  )}
                </div>
                <span className={`text-base ${isSelected ? "text-[var(--exam-text)] font-medium" : "text-[var(--exam-text)]"}`}>
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 border-t border-[var(--exam-border)] bg-[var(--exam-bg)] flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={isFirst}
          className="px-5 py-2 text-sm font-medium rounded-[var(--radius-exam)] border border-[var(--exam-border)] bg-white text-[var(--exam-text)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={isLast}
          className="px-5 py-2 text-sm font-medium rounded-[var(--radius-exam)] bg-[var(--exam-accent)] text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

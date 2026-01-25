import React from "react";
import { Check, Clock, Circle } from "lucide-react";
import clsx from "clsx";

// Order of steps logic mapped to English labels
// Matches logic from Visily PDF "Scholarship Contract Journey"
const STEPS = [
  { id: "SELECTED", label: "Awarded" },
  { id: "NOTIFIED", label: "Data Check" },
  { id: "DOCS_UPLOADED", label: "Review" },
  { id: "REVIEW_PENDING", label: "Validation" }, // Admin Validation
  { id: "APPROVED", label: "Approved" },
  { id: "PAID", label: "Disbursed" },
];

export const Timeline = ({ currentStatus }) => {
  // Helper to find active index
  const getCurrentStepIndex = () => {
    // Mapping complex backend statuses to visual steps
    if (currentStatus === "CONTRACT_GENERATED" || currentStatus === "SIGNED")
      return 3; // Visual position around "Validation"
    if (currentStatus === "CHANGES_REQUESTED") return 2; // Return to Review/Docs

    // Default search
    const index = STEPS.findIndex((s) => s.id === currentStatus);
    return index === -1 ? 0 : index; // Fallback to 0 if not found
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-8 px-4 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[600px] relative">
        {/* Background Line (Gray) */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 -z-10 rounded-full" />

        {/* Active Line (Brand Blue) */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-brand-blue -translate-y-1/2 -z-10 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative group"
            >
              {/* Icon Bubble */}
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10",
                  isCompleted
                    ? "bg-brand-blue border-brand-blue text-white shadow-md"
                    : "bg-white border-gray-300 text-gray-400",
                  isCurrent && "ring-4 ring-blue-100 scale-110",
                )}
              >
                {isCompleted ? (
                  isCurrent ? (
                    <Clock size={18} className="animate-pulse" />
                  ) : (
                    <Check size={18} />
                  )
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  "absolute top-12 text-xs font-semibold whitespace-nowrap transition-colors duration-300",
                  isCompleted ? "text-brand-blue" : "text-gray-400",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from "react";
import { CheckCircle, Circle, Clock, XCircle } from "lucide-react";
import clsx from "clsx";

// Order of steps logic
const STEPS = [
  { id: "SELECTED", label: "Selected" },
  { id: "NOTIFIED", label: "Notified" },
  { id: "DOCS_UPLOADED", label: "Docs Uploaded" },
  { id: "REVIEW_PENDING", label: "Under Review" },
  { id: "APPROVED", label: "Approved" }, // Simplified view for student
  { id: "PAID", label: "Scholarship Paid" },
];

export const Timeline = ({ currentStatus }) => {
  // Helper to find index
  const getCurrentStepIndex = () => {
    // Mapping complex backend statuses to visual steps
    if (currentStatus === "CONTRACT_GENERATED" || currentStatus === "SIGNED")
      return 3;
    if (currentStatus === "CHANGES_REQUESTED") return 2; // Go back visually to docs
    return STEPS.findIndex((s) => s.id === currentStatus);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between w-full">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative flex-1"
            >
              {/* Connector Line */}
              {index !== 0 && (
                <div
                  className={clsx(
                    "absolute top-4 right-[50%] w-full h-1 -z-10",
                    index <= currentIndex ? "bg-primary-600" : "bg-gray-200",
                  )}
                />
              )}

              {/* Icon Bubble */}
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white",
                  isCompleted
                    ? "border-primary-600 text-primary-600"
                    : "border-gray-300 text-gray-300",
                  isCurrent && "ring-4 ring-primary-100",
                )}
              >
                {isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  "text-xs mt-2 font-medium",
                  isCurrent ? "text-primary-800" : "text-gray-500",
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

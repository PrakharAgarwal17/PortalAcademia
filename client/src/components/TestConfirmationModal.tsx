import { useState, useEffect } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, X, AlertTriangle } from "lucide-react";

interface TestConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSkills: string[];
  initialTargetSkill?: string;
  onConfirmStart: (targetSkill: string) => void;
  isGenerating?: boolean;
}

export default function TestConfirmationModal({
  isOpen,
  onClose,
  userSkills,
  initialTargetSkill,
  onConfirmStart,
  isGenerating = false,
}: TestConfirmationModalProps) {
  const availableSkills = userSkills.length > 0 ? userSkills : ["React", "Node.js", "Python", "Full-Stack Development"];
  const [selectedTargetSkill, setSelectedTargetSkill] = useState<string>(
    initialTargetSkill || availableSkills[0] || "React"
  );

  useEffect(() => {
    if (initialTargetSkill && availableSkills.includes(initialTargetSkill)) {
      setSelectedTargetSkill(initialTargetSkill);
    } else if (availableSkills.length > 0 && !availableSkills.includes(selectedTargetSkill)) {
      setSelectedTargetSkill(availableSkills[0]);
    }
  }, [initialTargetSkill, userSkills]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-lg w-full max-w-xl p-5 lg:p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 mb-1 font-bold">
              <ShieldCheck className="w-3 h-3" />
              Per-Skill Dedicated Competency Exam Setup
            </div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Select Skill / Language for Assessment
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each language or skill gets its own dedicated 10-question evaluation exam.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground border border-border cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Select Target Skill */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
            1. Select Target Skill / Technology ({selectedTargetSkill})
          </label>
          <div className="p-3 rounded-md bg-background border border-border space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Select the specific technology you want to get tested and badge-verified for:
            </p>
            <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
              {availableSkills.map((skill) => {
                const isSelected = selectedTargetSkill.toLowerCase() === skill.toLowerCase();
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => setSelectedTargetSkill(skill)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-105"
                        : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {isSelected ? <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" /> : null}
                    <span>{skill} Test</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Exam Blueprint & Structure */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
            2. Dedicated {selectedTargetSkill} Exam Format (10 Questions)
          </label>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-sm">
                3 Easy MCQs
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Baseline Concepts (1 pt each)
              </span>
            </div>

            <div className="p-2.5 rounded-md bg-blue-500/5 border border-blue-500/20 space-y-1">
              <span className="font-bold text-blue-600 dark:text-blue-400 block text-sm">
                3 Medium MCQs
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Architecture & Logic (2 pts each)
              </span>
            </div>

            <div className="p-2.5 rounded-md bg-purple-500/5 border border-purple-500/20 space-y-1">
              <span className="font-bold text-purple-600 dark:text-purple-400 block text-sm">
                4 Stack Scenarios
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Real Scenarios (3 Min Timer)
              </span>
            </div>
          </div>
        </div>

        {/* Anti-AI Notice */}
        <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-[11px]">Writing Timer & Telemetry Anti-AI Rules:</span>
            <p className="text-[10px] opacity-90 leading-normal">
              Every writing question has a <strong>3-minute live timer</strong>. If a written answer is submitted in <strong>under 10 seconds</strong> (&lt;10s), it will be flagged as <em>"Seems AI Generated"</em> in telemetry.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-3 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isGenerating || !selectedTargetSkill}
            onClick={() => onConfirmStart(selectedTargetSkill)}
            className="text-xs font-bold px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? `Generating ${selectedTargetSkill} Test...` : `Start ${selectedTargetSkill} Exam`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}


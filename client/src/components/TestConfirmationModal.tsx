import { useState, useEffect } from "react";
import { CheckCircle2, ShieldCheck, Sparkles, X, AlertTriangle, Loader2, Plus } from "lucide-react";

interface TestConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSkills: string[];
  initialTargetSkill?: string;
  onConfirmStart: (targetSkill: string) => void;
  isGenerating?: boolean;
}

const POPULAR_SUGGESTIONS = [
  "React",
  "Node.js",
  "Python",
  "Docker",
  "Kubernetes",
  "TypeScript",
  "PostgreSQL",
  "PyTorch",
  "Rust",
  "Go",
  "AWS Architecture",
  "Cyber Security",
];

export default function TestConfirmationModal({
  isOpen,
  onClose,
  userSkills,
  initialTargetSkill,
  onConfirmStart,
  isGenerating = false,
}: TestConfirmationModalProps) {
  const [selectedTargetSkill, setSelectedTargetSkill] = useState<string>(
    initialTargetSkill || userSkills[0] || "React"
  );
  const [customSkillInput, setCustomSkillInput] = useState<string>("");

  useEffect(() => {
    if (initialTargetSkill) {
      setSelectedTargetSkill(initialTargetSkill);
    } else if (userSkills.length > 0 && !selectedTargetSkill) {
      setSelectedTargetSkill(userSkills[0] ?? "React");
    }
  }, [initialTargetSkill, userSkills, selectedTargetSkill]);

  if (!isOpen) return null;

  const handleSelectSkill = (skill: string) => {
    setSelectedTargetSkill(skill);
    setCustomSkillInput("");
  };

  const handleCustomSkillAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed) {
      setSelectedTargetSkill(trimmed);
      setCustomSkillInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-md w-full max-w-xl p-5 lg:p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 mb-1 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              On-The-Spot AI Competency Evaluation
            </div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Select or Request Skill Assessment
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Groq AI synthesizes an authentic 10-question evaluation tailored to your selected technology.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground border border-border cursor-pointer transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Select Target Skill */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
              1. Selected Technology: <span className="text-primary font-mono lowercase">{selectedTargetSkill}</span>
            </label>
          </div>

          {/* User's Profile Skills */}
          {userSkills.length > 0 && (
            <div className="p-3 rounded-md bg-background border border-border space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground block">
                From your active profile:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {userSkills.map((skill) => {
                  const isSelected = selectedTargetSkill.toLowerCase() === skill.toLowerCase();
                  return (
                    <button
                      key={skill}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleSelectSkill(skill)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-sm border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-secondary/40 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3 h-3 text-primary-foreground" /> : null}
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Skill Input */}
          <form onSubmit={handleCustomSkillAdd} className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Or test any arbitrary technology / framework:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                placeholder="Type custom skill (e.g., Rust, PyTorch, GraphQL, Linux)..."
                disabled={isGenerating}
                className="flex-1 h-9 px-3 rounded-sm bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-hidden"
              />
              <button
                type="submit"
                disabled={isGenerating || !customSkillInput.trim()}
                className="h-9 px-3 rounded-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Select</span>
              </button>
            </div>
          </form>

          {/* Quick suggestions */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-mono">Suggested trending topics:</span>
            <div className="flex flex-wrap gap-1">
              {POPULAR_SUGGESTIONS.map((skill) => {
                const isSelected = selectedTargetSkill.toLowerCase() === skill.toLowerCase();
                return (
                  <button
                    key={skill}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleSelectSkill(skill)}
                    className={`text-[11px] px-2 py-0.5 rounded-sm border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/20 border-primary text-primary font-semibold"
                        : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Exam Blueprint & Structure */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
            2. Dedicated {selectedTargetSkill} Evaluation Blueprint (10 Questions)
          </label>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-sm bg-emerald-500/5 border border-emerald-500/20 space-y-0.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 block text-xs">
                3 Easy MCQs
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Syntax & Mechanics (1 pt)
              </span>
            </div>

            <div className="p-2 rounded-sm bg-blue-500/5 border border-blue-500/20 space-y-0.5">
              <span className="font-semibold text-blue-600 dark:text-blue-400 block text-xs">
                3 Medium MCQs
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Architecture & Logic (2 pts)
              </span>
            </div>

            <div className="p-2 rounded-sm bg-purple-500/5 border border-purple-500/20 space-y-0.5">
              <span className="font-semibold text-purple-600 dark:text-purple-400 block text-xs">
                4 Stack Scenarios
              </span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                Real Outages (3 Min Timer)
              </span>
            </div>
          </div>
        </div>

        {/* Anti-AI Notice */}
        <div className="p-2.5 rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block text-[11px]">Telemetry Anti-AI Writing Rule:</span>
            <p className="text-[10px] opacity-90 leading-normal">
              Written scenario questions must be explained in your own engineering words. Submitting complex written solutions in &lt;10s triggers AI generation telemetry flags.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-[11px] font-mono text-muted-foreground">
            Target: <strong className="text-foreground">{selectedTargetSkill}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="h-9 text-xs font-medium px-3 rounded-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGenerating || !selectedTargetSkill}
              onClick={() => onConfirmStart(selectedTargetSkill)}
              className="h-9 text-xs font-semibold px-4 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Test with AI…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start {selectedTargetSkill} Exam</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



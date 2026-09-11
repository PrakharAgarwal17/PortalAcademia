import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
import { searchSkillSuggestions, getSkillIcon } from "@/lib/skillIcons";
import SkillBadge from "./SkillBadge";
import { Sparkles, Plus, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillInputProps {
  skills: string[];
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  placeholder?: string;
  maxSkills?: number;
  label?: string;
  showPopularSuggestions?: boolean;
}

const POPULAR_SKILLS = [
  "Python",
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Docker",
  "Tailwind CSS",
  "MongoDB",
  "PostgreSQL",
  "Git",
];

export default function SkillInput({
  skills,
  onAddSkill,
  onRemoveSkill,
  placeholder = "Type a skill (e.g. Python, React, Docker) and select…",
  maxSkills = 30,
  label,
  showPopularSuggestions = true,
}: SkillInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions filtered by query
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return searchSkillSuggestions(query.trim(), 8);
  }, [query]);

  // Handle clicking outside to close suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  const handleSelect = (skillTitle: string) => {
    const trimmed = skillTitle.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      setQuery("");
      setIsOpen(false);
      return;
    }
    if (skills.length >= maxSkills) return;

    onAddSkill(trimmed);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex((prev) => (prev < suggestions.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && suggestions.length > 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex].title);
      } else if (query.trim()) {
        // Add whatever user typed directly
        handleSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="space-y-2.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{label}</span>
          </label>
          {skills.length > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {skills.length} / {maxSkills}
            </span>
          )}
        </div>
      )}

      {/* Input container with floating autocomplete */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={skills.length >= maxSkills}
            className="w-full h-8 pl-8 pr-20 rounded-md border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus-ring transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              if (query.trim()) handleSelect(query.trim());
            }}
            disabled={!query.trim() || skills.length >= maxSkills}
            className="absolute right-1.5 h-6 px-2 text-[11px] font-medium rounded border border-border bg-muted hover:bg-foreground hover:text-background text-foreground transition-colors disabled:opacity-40 cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && query.trim().length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg text-popover-foreground">
            {suggestions.length > 0 ? (
              <div className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Matching Simple Icons ({suggestions.length})
                </div>
                {suggestions.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const alreadyAdded = skills.some(
                    (s) => s.toLowerCase() === item.title.toLowerCase()
                  );

                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => handleSelect(item.title)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-xs transition-colors cursor-pointer text-left",
                        isSelected ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted/70",
                        alreadyAdded && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          role="img"
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ fill: `#${item.hex}` }}
                          aria-hidden="true"
                        >
                          <path d={item.path} />
                        </svg>
                        <span>{item.title}</span>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500" /> Added
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          #{item.slug}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Option to add custom raw query if exact title not in list */}
                {!suggestions.some(
                  (s) => s.title.toLowerCase() === query.trim().toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={() => handleSelect(query.trim())}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-xs text-primary hover:bg-primary/10 transition-colors border-t border-border/50 mt-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add custom skill &quot;{query.trim()}&quot;</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2 text-center text-xs text-muted-foreground">
                <p>No direct brand icon match for &quot;{query}&quot;</p>
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim())}
                  className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add &quot;{query.trim()}&quot; anyway</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popular quick-pick chips if few skills selected */}
      {showPopularSuggestions && skills.length < 5 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] uppercase font-mono text-muted-foreground mr-1">
            Popular:
          </span>
          {POPULAR_SKILLS.filter((s) => !skills.includes(s)).slice(0, 6).map((popSkill) => {
            const icon = getSkillIcon(popSkill);
            return (
              <button
                key={popSkill}
                type="button"
                onClick={() => handleSelect(popSkill)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs hover:scale-102"
              >
                {icon && (
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 shrink-0"
                    style={{ fill: `#${icon.hex}` }}
                    aria-hidden="true"
                  >
                    <path d={icon.path} />
                  </svg>
                )}
                <span>+ {popSkill}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Skill Badges */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map((s) => (
            <SkillBadge
              key={s}
              skill={s}
              onRemove={() => onRemoveSkill(s)}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  );
}

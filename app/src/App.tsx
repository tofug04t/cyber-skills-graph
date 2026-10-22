import { useEffect, useMemo, useRef, useState } from "react";
import { useGraphData } from "./data/useGraphData";
import { GraphCanvas } from "./components/GraphCanvas";
import { FacetSection } from "./components/FacetSection";
import { RoleFacet, type EmptyAction } from "./components/RoleFacet";
import { AppliedFilters, type AppliedChip } from "./components/AppliedFilters";
import { SkillPicker } from "./components/SkillPicker";
import { RoleDetail } from "./components/RoleDetail";
import { SkillDetail } from "./components/SkillDetail";
import { MatchToggle } from "./components/MatchToggle";
import { WheelLegend } from "./components/WheelLegend";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toast } from "./components/Toast";
import { AboutDialog } from "./components/AboutDialog";
import { buildWheelNodes } from "./graphViews";
import {
  buildTitleIndex,
  computeCandidates,
  matchRoles,
  matchSkills,
  searchTitles,
  skillLabel,
  skillsOfRoles,
  relatedSkills,
  titleKey,
  titlesForRole,
  type FilterState,
} from "./filters";
import { useTheme } from "./useTheme";
import { FEEDBACK_URL } from "./credits";
import type { Assessment, AssessmentValue, MatchMode } from "./types";
import "./App.css";

interface UrlState {
  roleIds: string[];
  skillIds: string[];
  title: string | null;
  skillMode: MatchMode;
  roleMode: MatchMode;
  assessment: Assessment;
}

type Facet = "role" | "skill";

interface Snapshot {
  roleIds: string[];
  skillIds: string[];
  activeTitle: string | null;
  open: { role: boolean; skill: boolean };
}

const UNDO_MS = 8000;

interface FilterItem {
  key: string;
  kind: string;
  label: string;
  without: (f: FilterState) => FilterState;
  remove: () => void;
}

function parseUrlState(): UrlState {
  const params = new URLSearchParams(window.location.search);
  const assessment: Assessment = {};
  for (const pair of (params.get("a") ?? "").split(",")) {
    const [id, value] = pair.split(":");
    if (id && (value === "have" || value === "partial" || value === "missing")) assessment[id] = value;
  }
  const roles = `${params.get("roles") ?? ""},${params.get("role") ?? ""}`;
  return {
    roleIds: [...new Set(roles.split(",").filter(Boolean))],
    skillIds: (params.get("skills") ?? "").split(",").filter(Boolean),
    title: params.get("title"),
    skillMode: params.get("skillMatch") === "any" ? "any" : "all",
    roleMode: params.get("roleMatch") === "all" ? "all" : "any",
    assessment,
  };
}

function App() {
  const { graph, jobTitles, error } = useGraphData();
  const [theme, toggleTheme] = useTheme();
  const initial = useMemo(() => parseUrlState(), []);

  const [roleIds, setRoleIds] = useState<string[]>(initial.roleIds);
  const [skillIds, setSkillIds] = useState<string[]>(initial.skillIds);
  const [activeTitle, setActiveTitle] = useState<string | null>(initial.title);
  const [skillMode, setSkillMode] = useState<MatchMode>(initial.skillMode);
  const [roleMode, setRoleMode] = useState<MatchMode>(initial.roleMode);
  const [assessment, setAssessment] = useState<Assessment>(initial.assessment);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Partial<Record<Facet, boolean>>>({});
  const [open, setOpen] = useState({
    role: true,
    skill: initial.skillIds.length > 0,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleIds.length > 0) params.set("roles", roleIds.join(","));
    const entries = Object.entries(assessment);
    if (entries.length > 0) params.set("a", entries.map(([id, v]) => `${id}:${v}`).join(","));
    if (skillIds.length > 0) params.set("skills", skillIds.join(","));
    if (activeTitle) params.set("title", activeTitle);
    // only the non-default modes go in the URL
    if (skillMode === "any") params.set("skillMatch", "any");
    if (roleMode === "all") params.set("roleMatch", "all");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [roleIds, skillIds, activeTitle, skillMode, roleMode, assessment]);

  const titleIndex = useMemo(() => (jobTitles ? buildTitleIndex(jobTitles) : null), [jobTitles]);

  const candidates = useMemo(
    () =>
      graph && titleIndex
        ? computeCandidates(graph, { skillIds, skillMode, titleKey: activeTitle }, titleIndex)
        : null,
    [graph, titleIndex, skillIds, skillMode, activeTitle]
  );

  const matches = useMemo(
    () =>
      graph && titleIndex && candidates
        ? {
            roleIds: matchRoles(graph, candidates.roleIds, query),
            titles: searchTitles(titleIndex, query),
            skills: matchSkills(graph, query),
          }
        : null,
    [graph, titleIndex, candidates, query]
  );

  const selectedRoles = useMemo(
    () => (graph ? roleIds.filter((id) => graph.workRoles[id]) : []),
    [graph, roleIds]
  );

  // Selected roles narrow the skill list too; skills you picked stay visible.
  const visibleSkills = useMemo(() => {
    if (!graph || !matches) return null;
    if (selectedRoles.length === 0) return matches.skills;
    const allowed = skillsOfRoles(graph, selectedRoles, roleMode);
    return matches.skills.filter((s) => allowed.has(s.id) || skillIds.includes(s.id));
  }, [graph, matches, selectedRoles, roleMode, skillIds]);

  // Selected roles light up their skills; a title filter previews its candidate roles.
  const view = useMemo(() => {
    if (!graph || !candidates) return null;
    const roleSkills =
      selectedRoles.length > 0
        ? skillsOfRoles(graph, selectedRoles, roleMode)
        : activeTitle
          ? skillsOfRoles(graph, candidates.roleIds)
          : [];
    const highlight = new Set([...roleSkills, ...skillIds]);
    const active = highlight.size > 0;
    return {
      nodes: buildWheelNodes(graph, theme, {
        highlight: active ? highlight : null,
        selected: new Set(skillIds),
        assessment: active ? assessment : null,
      }),
      fitIds: active ? [...highlight] : [],
    };
  }, [graph, candidates, selectedRoles, roleMode, activeTitle, skillIds, assessment, theme]);

  const [undo, setUndo] = useState<Snapshot | null>(null);

  const clearRoles = () => setRoleIds([]);

  const clearAll = () => {
    if (roleIds.length === 0 && skillIds.length === 0 && !activeTitle) return;
    setUndo({ roleIds, skillIds, activeTitle, open });
    setRoleIds([]);
    setSkillIds([]);
    setActiveTitle(null);
    setOpen({ role: true, skill: false });
  };

  const undoClear = () => {
    if (!undo) return;
    setRoleIds(undo.roleIds);
    setSkillIds(undo.skillIds);
    setActiveTitle(undo.activeTitle);
    setOpen(undo.open);
    setUndo(null);
  };

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  // Esc peels one layer: the selected roles first, then the filters.
  const escapeRef = useRef<() => void>(() => {});
  useEffect(() => {
    escapeRef.current = () => (roleIds.length > 0 ? clearRoles() : clearAll());
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable], dialog")) return;
      escapeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (error) return <div className="app-error">Failed to load data: {error}</div>;
  if (!graph || !jobTitles || !titleIndex || !candidates || !view || !matches || !visibleSkills) {
    return <div className="app-loading">Loading NICE Framework data...</div>;
  }

  const counts: Record<Facet, number> = {
    role: matches.roleIds.length + matches.titles.length,
    skill: visibleSkills.length,
  };
  const searching = query.trim() !== "";
  // While searching, sections with matches open themselves unless the user toggled them.
  const isOpen = (facet: Facet) => overrides[facet] ?? (searching ? counts[facet] > 0 : open[facet]);

  const toggleFacet = (facet: Facet) =>
    searching
      ? setOverrides({ ...overrides, [facet]: !isOpen(facet) })
      : setOpen((o) => ({ ...o, [facet]: !o[facet] }));

  const matchCount = (facet: Facet) =>
    searching ? (
      <span className="facet__count">
        {counts[facet]} {counts[facet] === 1 ? "match" : "matches"}
      </span>
    ) : null;

  const updateQuery = (value: string) => {
    setQuery(value);
    setOverrides({});
  };

  const toggleRole = (id: string) =>
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const toggleSkill = (id: string) =>
    setSkillIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const assess = (skillId: string, value: AssessmentValue) =>
    setAssessment((prev) => ({ ...prev, [skillId]: value }));

  const handleNodeClick = (id: string) => {
    toggleSkill(id);
    setOpen((o) => ({ ...o, skill: true }));
  };

  const filterState: FilterState = { skillIds, skillMode, titleKey: activeTitle };
  const filterItems: FilterItem[] = [
    ...(activeTitle
      ? [
          {
            key: "title",
            kind: "Title",
            label: titleIndex.get(activeTitle)?.title ?? activeTitle,
            without: (f: FilterState): FilterState => ({ ...f, titleKey: null }),
            remove: () => setActiveTitle(null),
          },
        ]
      : []),
    ...skillIds.map((id) => ({
      key: `skill:${id}`,
      kind: "Skill",
      label: skillLabel(graph.skills[id]) || id,
      without: (f: FilterState): FilterState => ({
        ...f,
        skillIds: f.skillIds.filter((s) => s !== id),
      }),
      remove: () => toggleSkill(id),
    })),
  ];

  const chips: AppliedChip[] = [
    ...selectedRoles.map((id) => ({
      key: `role:${id}`,
      kind: "Role",
      label: graph.workRoles[id].title,
      onRemove: () => toggleRole(id),
    })),
    ...filterItems.map((i) => ({ key: i.key, kind: i.kind, label: i.label, onRemove: i.remove })),
  ];

  const summary =
    [
      candidates.active ? `${candidates.roleIds.length} of ${Object.keys(graph.workRoles).length} roles` : null,
      selectedRoles.length > 0
        ? `${skillsOfRoles(graph, selectedRoles, roleMode).size} of ${Object.keys(graph.skills).length} skills`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || null;

  const emptyActions: EmptyAction[] =
    candidates.active && candidates.roleIds.length === 0
      ? filterItems
          .map((i) => ({
            key: i.key,
            label: `${i.kind.toLowerCase()}: ${i.label}`,
            count: computeCandidates(graph, i.without(filterState), titleIndex).roleIds.length,
            onApply: i.remove,
          }))
          .filter((a) => a.count > 0)
      : [];

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title">
          <h1>Cyber Skills Graph</h1>
          <p className="app__subtitle">
            Explore cybersecurity jobs, the skills they use, and check how your own skills measure up.
          </p>
        </div>
        <div className="app__header-actions">
          <a className="link-button" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
            Feedback
          </a>
          <button type="button" className="link-button" onClick={() => setAboutOpen(true)}>
            About
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <div className="app__body">
        <aside className="app__panel">
          <p className="hint">
            {selectedRoles.length > 0
              ? "Selected roles light up their skills. Rate each skill below to see your gap."
              : "Pick a role to see its skills, or pick skills you already have to see which roles use them. You can also click a skill on the map. Rate each skill Strong, Some or None to see your gaps."}
          </p>

          <input
            type="search"
            className="input search"
            placeholder="Search roles, skills, job titles..."
            aria-label="Search roles, skills, and job titles"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
          />

          <AppliedFilters chips={chips} summary={summary} onClearAll={clearAll} />

          <FacetSection
            label="Role"
            question="Know the job you want?"
            open={isOpen("role")}
            onToggle={() => toggleFacet("role")}
            summary={
              <>
                {matchCount("role")}
                {selectedRoles.length > 0 ? (
                  <span className="badge badge--accent">
                    {selectedRoles.length === 1 ? graph.workRoles[selectedRoles[0]].title : `${selectedRoles.length} selected`}
                  </span>
                ) : activeTitle ? (
                  <span className="badge badge--accent">
                    {titleIndex.get(activeTitle)?.title ?? activeTitle}
                  </span>
                ) : null}
              </>
            }
          >
            {selectedRoles.length > 1 && (
              <MatchToggle
                before="Show skills used by"
                after="selected roles"
                value={roleMode}
                onChange={setRoleMode}
              />
            )}
            <RoleFacet
              graph={graph}
              visibleRoleIds={matches.roleIds}
              titleMatches={matches.titles}
              candidates={candidates}
              skillCount={skillMode === "any" ? skillIds.length : 0}
              selectedRoleIds={selectedRoles}
              onToggleRole={toggleRole}
              onTitle={(key) => {
                setActiveTitle(key);
                updateQuery("");
              }}
              emptyActions={emptyActions}
              onClearAll={clearAll}
            />
          </FacetSection>

          <FacetSection
            label="Skill"
            question="Know what you're good at?"
            open={isOpen("skill")}
            onToggle={() => toggleFacet("skill")}
            summary={
              <>
                {matchCount("skill")}
                {skillIds.length > 0 ? (
                  <span className="badge badge--accent">{skillIds.length} selected</span>
                ) : null}
              </>
            }
          >
            {skillIds.length > 1 && (
              <MatchToggle
                before="Show roles using"
                after="selected skills"
                value={skillMode}
                onChange={setSkillMode}
              />
            )}
            <SkillPicker
              skills={visibleSkills}
              selected={skillIds}
              assessment={assessment}
              onAssess={assess}
              onToggle={toggleSkill}
            />
          </FacetSection>

          {skillIds.map((id) => (
            <SkillDetail
              key={id}
              graph={graph}
              skill={graph.skills[id]}
              related={relatedSkills(graph, id)}
              assessment={assessment}
              defaultOpen={skillIds.length === 1}
              onAssess={assess}
              onToggleRole={toggleRole}
              onAddSkill={toggleSkill}
              onRemove={() => toggleSkill(id)}
            />
          ))}

          {selectedRoles.map((id) => {
            const role = graph.workRoles[id];
            return (
              <RoleDetail
                key={id}
                role={role}
                skills={role.skills.map((sid) => graph.skills[sid]).filter(Boolean)}
                titles={titlesForRole(jobTitles, id)}
                assessment={assessment}
                defaultOpen={selectedRoles.length === 1}
                onAssess={assess}
                onTitle={(t) => setActiveTitle(titleKey(t))}
                onResetMarks={() =>
                  setAssessment((prev) => {
                    const next = { ...prev };
                    for (const sid of role.skills) delete next[sid];
                    return next;
                  })
                }
                onRemove={() => toggleRole(id)}
              />
            );
          })}
        </aside>

        <main className="app__graph">
          <GraphCanvas
            nodes={view.nodes}
            theme={theme}
            fitIds={view.fitIds}
            onNodeClick={handleNodeClick}
            onBackgroundClick={() => selectedRoles.length > 0 && clearRoles()}
          />
          <WheelLegend />
        </main>
      </div>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {undo && roleIds.length === 0 && skillIds.length === 0 && !activeTitle && (
        <Toast message="Filters cleared" actionLabel="Undo" onAction={undoClear} />
      )}
    </div>
  );
}

export default App;

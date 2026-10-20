import { useEffect, useMemo, useRef, useState } from "react";
import { useGraphData } from "./data/useGraphData";
import { GraphCanvas } from "./components/GraphCanvas";
import { FacetSection } from "./components/FacetSection";
import { RoleFacet, type EmptyAction } from "./components/RoleFacet";
import { AppliedFilters, type AppliedChip } from "./components/AppliedFilters";
import { SkillPicker } from "./components/SkillPicker";
import { BackgroundFacet } from "./components/BackgroundFacet";
import { RoleDetail } from "./components/RoleDetail";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toast } from "./components/Toast";
import { AboutDialog } from "./components/AboutDialog";
import { applyHighlight, buildGapElements, buildOverviewElements } from "./graphViews";
import {
  buildTitleIndex,
  computeCandidates,
  matchFeeders,
  matchRoles,
  matchSkills,
  searchTitles,
  skillLabel,
  pathwaysIntoRole,
  titleKey,
  titlesForRole,
  type FilterState,
} from "./filters";
import { useTheme } from "./useTheme";
import type { Assessment, AssessmentValue } from "./types";
import "./App.css";

interface UrlState {
  role: string | null;
  skillIds: string[];
  title: string | null;
  feederId: string | null;
  assessment: Assessment;
}

type Facet = "role" | "skill" | "background";

interface Snapshot {
  roleId: string | null;
  skillIds: string[];
  activeTitle: string | null;
  feederId: string | null;
  open: { role: boolean; skill: boolean; background: boolean };
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
  return {
    role: params.get("role"),
    skillIds: (params.get("skills") ?? "").split(",").filter(Boolean).slice(0, 2),
    title: params.get("title"),
    feederId: params.get("bg"),
    assessment,
  };
}

function App() {
  const { graph, jobTitles, pathways, error } = useGraphData();
  const [theme, toggleTheme] = useTheme();
  const initial = useMemo(() => parseUrlState(), []);

  const [roleId, setRoleId] = useState<string | null>(initial.role);
  const [skillIds, setSkillIds] = useState<string[]>(initial.skillIds);
  const [activeTitle, setActiveTitle] = useState<string | null>(initial.title);
  const [feederId, setFeederId] = useState<string | null>(initial.feederId);
  const [assessment, setAssessment] = useState<Assessment>(initial.assessment);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Partial<Record<Facet, boolean>>>({});
  const [open, setOpen] = useState({
    role: !initial.role,
    skill: initial.skillIds.length > 0,
    background: initial.feederId !== null,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleId) {
      params.set("role", roleId);
      const entries = Object.entries(assessment);
      if (entries.length > 0) params.set("a", entries.map(([id, v]) => `${id}:${v}`).join(","));
    }
    if (skillIds.length > 0) params.set("skills", skillIds.join(","));
    if (activeTitle) params.set("title", activeTitle);
    if (feederId) params.set("bg", feederId);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [roleId, skillIds, activeTitle, feederId, assessment]);

  const titleIndex = useMemo(() => (jobTitles ? buildTitleIndex(jobTitles) : null), [jobTitles]);

  const candidates = useMemo(
    () =>
      graph && titleIndex && pathways
        ? computeCandidates(graph, { skillIds, titleKey: activeTitle, feederId }, titleIndex, pathways)
        : null,
    [graph, titleIndex, pathways, skillIds, activeTitle, feederId]
  );

  const matches = useMemo(
    () =>
      graph && pathways && titleIndex && candidates
        ? {
            roleIds: matchRoles(graph, candidates.roleIds, query),
            titles: searchTitles(titleIndex, query),
            skills: matchSkills(graph, query),
            feeders: matchFeeders(pathways, query),
          }
        : null,
    [graph, pathways, titleIndex, candidates, query]
  );

  const baseElements = useMemo(() => (graph ? buildOverviewElements(graph, theme) : null), [graph, theme]);

  const focusedRole = graph && roleId ? (graph.workRoles[roleId] ?? null) : null;

  const view = useMemo(() => {
    if (!graph || !baseElements || !candidates) return null;
    if (focusedRole) {
      return {
        ...buildGapElements(graph, focusedRole.id, assessment, theme),
        layoutKey: `gap:${focusedRole.id}`,
        fitIds: [] as string[],
      };
    }
    if (!candidates.active) {
      return { ...baseElements, layoutKey: "overview", fitIds: [] as string[] };
    }
    const roleSet = new Set(candidates.roleIds);
    const skillSet = new Set(skillIds);
    return {
      ...applyHighlight(graph, baseElements, roleSet, skillSet, theme),
      layoutKey: "overview",
      fitIds: [...candidates.roleIds, ...skillIds],
    };
  }, [graph, baseElements, candidates, focusedRole, assessment, theme, skillIds]);

  const [undo, setUndo] = useState<Snapshot | null>(null);

  const clearFocus = () => {
    setRoleId(null);
    setOpen((o) => ({ ...o, role: true }));
  };

  const clearAll = () => {
    if (!roleId && skillIds.length === 0 && !activeTitle && !feederId) return;
    setUndo({ roleId, skillIds, activeTitle, feederId, open });
    setRoleId(null);
    setSkillIds([]);
    setActiveTitle(null);
    setFeederId(null);
    setOpen({ role: true, skill: false, background: false });
  };

  const undoClear = () => {
    if (!undo) return;
    setRoleId(undo.roleId);
    setSkillIds(undo.skillIds);
    setActiveTitle(undo.activeTitle);
    setFeederId(undo.feederId);
    setOpen(undo.open);
    setUndo(null);
  };

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  // Esc peels one layer: the focused role first, then the filters.
  const escapeRef = useRef<() => void>(() => {});
  useEffect(() => {
    escapeRef.current = () => (roleId ? clearFocus() : clearAll());
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
  if (!graph || !jobTitles || !pathways || !titleIndex || !candidates || !view || !matches) {
    return <div className="app-loading">Loading NICE Framework data...</div>;
  }

  const counts: Record<Facet, number> = {
    role: matches.roleIds.length + matches.titles.length,
    skill: matches.skills.length,
    background: matches.feeders.length,
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

  const focusRole = (id: string) => {
    updateQuery("");
    setRoleId(id);
    setOpen((o) => ({ ...o, role: false }));
  };

  const toggleSkill = (id: string) =>
    setSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length >= 2 ? prev : [...prev, id]
    );

  const handleNodeClick = (id: string, kind: "workRole" | "skill") => {
    if (kind === "workRole") {
      focusRole(id);
    } else if (!focusedRole) {
      toggleSkill(id);
      setOpen((o) => ({ ...o, skill: true }));
    }
  };

  const feeder = pathways.feeder_roles.find((f) => f.feeder_id === feederId);

  const filterState: FilterState = { skillIds, titleKey: activeTitle, feederId };
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
    ...(feeder
      ? [
          {
            key: "bg",
            kind: "Background",
            label: feeder.feeder_title,
            without: (f: FilterState): FilterState => ({ ...f, feederId: null }),
            remove: () => setFeederId(null),
          },
        ]
      : []),
  ];

  const chips: AppliedChip[] = [
    ...(focusedRole
      ? [{ key: "role", kind: "Role", label: focusedRole.title, onRemove: clearFocus }]
      : []),
    ...filterItems.map((i) => ({ key: i.key, kind: i.kind, label: i.label, onRemove: i.remove })),
  ];

  const summary =
    !focusedRole && candidates.active
      ? `${candidates.roleIds.length} of ${Object.keys(graph.workRoles).length} roles`
      : null;

  const emptyActions: EmptyAction[] =
    candidates.active && candidates.roleIds.length === 0
      ? filterItems
          .map((i) => ({
            key: i.key,
            label: `${i.kind.toLowerCase()}: ${i.label}`,
            count: computeCandidates(graph, i.without(filterState), titleIndex, pathways).roleIds.length,
            onApply: i.remove,
          }))
          .filter((a) => a.count > 0)
      : [];

  return (
    <div className="app">
      <header className="app__header">
        <h1>Cyber Skills Graph</h1>
        <div className="app__header-actions">
          <button type="button" className="link-button" onClick={() => setAboutOpen(true)}>
            About
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <div className="app__body">
        <aside className="app__panel">
          <p className="hint">
            {focusedRole
              ? "Mark each skill below to see your gap on the graph."
              : "Search everything below, or browse each section. You can also click the graph."}
          </p>

          <input
            type="search"
            className="input search"
            placeholder="Search roles, skills, job titles..."
            aria-label="Search roles, skills, job titles, and backgrounds"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
          />

          <AppliedFilters chips={chips} summary={summary} onClearAll={clearAll} />

          <FacetSection
            label="Role"
            open={isOpen("role")}
            onToggle={() => toggleFacet("role")}
            summary={
              <>
                {matchCount("role")}
                {focusedRole ? (
                  <span className="badge badge--accent">{focusedRole.title}</span>
                ) : activeTitle ? (
                  <span className="badge badge--accent">
                    {titleIndex.get(activeTitle)?.title ?? activeTitle}
                  </span>
                ) : null}
              </>
            }
          >
            <RoleFacet
              graph={graph}
              visibleRoleIds={matches.roleIds}
              titleMatches={matches.titles}
              candidates={candidates}
              skillCount={skillIds.length}
              focusedRoleId={roleId}
              onFocus={focusRole}
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
            <SkillPicker skills={matches.skills} selected={skillIds} onToggle={toggleSkill} />
          </FacetSection>

          <FacetSection
            label="Background"
            open={isOpen("background")}
            onToggle={() => toggleFacet("background")}
            summary={
              <>
                {matchCount("background")}
                {feeder ? <span className="badge badge--accent">{feeder.feeder_title}</span> : null}
              </>
            }
          >
            <BackgroundFacet
              pathways={pathways}
              feeders={matches.feeders}
              feederId={feederId}
              onSelect={setFeederId}
            />
          </FacetSection>

          {focusedRole && (
            <RoleDetail
              role={focusedRole}
              skills={focusedRole.skills.map((id) => graph.skills[id]).filter(Boolean)}
              titles={titlesForRole(jobTitles, focusedRole.id)}
              pathways={pathwaysIntoRole(pathways, focusedRole.id)}
              assessment={assessment}
              onAssess={(skillId: string, value: AssessmentValue) =>
                setAssessment((prev) => ({ ...prev, [skillId]: value }))
              }
              onTitle={(t) => {
                setActiveTitle(titleKey(t));
                clearFocus();
              }}
              onResetMarks={() =>
                setAssessment((prev) => {
                  const next = { ...prev };
                  for (const id of focusedRole.skills) delete next[id];
                  return next;
                })
              }
              onClose={clearFocus}
            />
          )}
        </aside>

        <main className="app__graph">
          <GraphCanvas
            nodes={view.nodes}
            edges={view.edges}
            theme={theme}
            layoutKey={view.layoutKey}
            fitIds={view.fitIds}
            onNodeClick={handleNodeClick}
            onBackgroundClick={() => focusedRole && clearFocus()}
          />
        </main>
      </div>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {undo && !roleId && skillIds.length === 0 && !activeTitle && !feederId && (
        <Toast message="Filters cleared" actionLabel="Undo" onAction={undoClear} />
      )}
    </div>
  );
}

export default App;

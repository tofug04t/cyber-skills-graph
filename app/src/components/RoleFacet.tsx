import { useMemo } from "react";
import type { GraphData } from "../types";
import { titleKey, type Candidates, type TitleEntry } from "../filters";
import { SpectralStrip } from "./SpectralStrip";

interface RoleFacetProps {
  graph: GraphData;
  visibleRoleIds: string[];
  titleMatches: TitleEntry[];
  candidates: Candidates;
  /** Skills counted for the overlap badge; 0 or 1 hides it. */
  skillCount: number;
  selectedRoleIds: string[];
  onToggleRole: (roleId: string) => void;
  onTitle: (key: string) => void;
  emptyActions: EmptyAction[];
  onClearAll: () => void;
}

export interface EmptyAction {
  key: string;
  label: string;
  count: number;
  onApply: () => void;
}

export function RoleFacet({
  graph,
  visibleRoleIds,
  titleMatches,
  candidates,
  skillCount,
  selectedRoleIds,
  onToggleRole,
  onTitle,
  emptyActions,
  onClearAll,
}: RoleFacetProps) {
  const grouped = useMemo(() => {
    if (candidates.active) return null;
    const byCategory: Record<string, string[]> = {};
    for (const id of visibleRoleIds) (byCategory[graph.workRoles[id].category] ??= []).push(id);
    for (const ids of Object.values(byCategory)) {
      ids.sort((a, b) => graph.workRoles[a].title.localeCompare(graph.workRoles[b].title));
    }
    return byCategory;
  }, [candidates.active, visibleRoleIds, graph]);

  const renderRole = (id: string) => {
    const role = graph.workRoles[id];
    const selected = selectedRoleIds.includes(id);
    const overlap = candidates.skillOverlap.get(id);
    return (
      <li key={id}>
        <button
          type="button"
          className={"role-row" + (selected ? " role-row--focused" : "")}
          aria-pressed={selected}
          onClick={() => onToggleRole(id)}
        >
          <SpectralStrip mix={role.mix} label={role.label} />
          <span className="role-row__title">{role.title}</span>
          {overlap !== undefined && skillCount > 1 && (
            <span className="badge">
              {overlap}/{skillCount} skills
            </span>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="role-facet">
      {selectedRoleIds.length === 0 && (
        <p className="hint">Select one role, or several to compare. Then rate how strong you are in each of its skills.</p>
      )}
      {titleMatches.length > 0 && (
        <ul className="list list--titles">
          {titleMatches.map((entry) => (
            <li key={entry.title}>
              <button type="button" className="title-row" onClick={() => onTitle(titleKey(entry.title))}>
                <span className="tag">Title</span>
                <span className="title-row__text">{entry.title}</span>
                <span className="title-row__count">
                  {entry.roleIds.length} {entry.roleIds.length === 1 ? "role" : "roles"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {candidates.active && candidates.roleIds.length === 0 && (
        <div className="empty-state">
          <p className="empty">No Work Roles match all of the applied filters.</p>
          <ul className="list">
            {emptyActions.map((action) => (
              <li key={action.key}>
                <button type="button" className="empty-state__action" onClick={action.onApply}>
                  Remove {action.label}
                  <span className="badge">
                    {action.count} {action.count === 1 ? "role" : "roles"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="link-button" onClick={onClearAll}>
            Clear all filters
          </button>
        </div>
      )}

      {visibleRoleIds.length === 0 &&
        titleMatches.length === 0 &&
        !(candidates.active && candidates.roleIds.length === 0) && <p className="empty">No matching roles.</p>}

      <div className="facet__scroll">
        {grouped
          ? Object.entries(graph.categories).map(([catId, catTitle]) => {
              const ids = grouped[catId];
              if (!ids || ids.length === 0) return null;
              return (
                <div key={catId} className="role-group">
                  <h4>{catTitle}</h4>
                  <ul className="list">{ids.map(renderRole)}</ul>
                </div>
              );
            })
          : visibleRoleIds.length > 0 && <ul className="list">{visibleRoleIds.map(renderRole)}</ul>}
      </div>
    </div>
  );
}

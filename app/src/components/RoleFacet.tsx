import { useMemo } from "react";
import type { GraphData } from "../types";
import { CATEGORY_COLORS } from "../constants";
import { titleKey, type Candidates, type TitleEntry } from "../filters";

interface RoleFacetProps {
  graph: GraphData;
  visibleRoleIds: string[];
  titleMatches: TitleEntry[];
  candidates: Candidates;
  skillCount: number;
  focusedRoleId: string | null;
  onFocus: (roleId: string) => void;
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
  focusedRoleId,
  onFocus,
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
    const pathway = candidates.pathway.get(id);
    const overlap = candidates.skillOverlap.get(id);
    return (
      <li key={id}>
        <button
          type="button"
          className={"role-row" + (id === focusedRoleId ? " role-row--focused" : "")}
          aria-pressed={id === focusedRoleId}
          onClick={() => onFocus(id)}
        >
          <span className="role-row__dot" style={{ background: CATEGORY_COLORS[role.category] }} />
          <span className="role-row__title">{role.title}</span>
          {overlap !== undefined && skillCount > 1 && (
            <span className="badge">
              {overlap}/{skillCount} skills
            </span>
          )}
          {pathway && (
            <span className={`badge badge--${pathway.transition_difficulty.toLowerCase()}`}>
              {pathway.transition_difficulty}
            </span>
          )}
        </button>
        {pathway && <p className="role-row__note">{pathway.rationale}</p>}
      </li>
    );
  };

  return (
    <div className="role-facet">
      {titleMatches.length > 0 && (
        <ul className="list list--titles">
          {titleMatches.map((entry) => (
            <li key={entry.title}>
              <button
                type="button"
                className="title-row"
                onClick={() => onTitle(titleKey(entry.title))}
              >
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
        !(candidates.active && candidates.roleIds.length === 0) && (
          <p className="empty">No matching roles.</p>
        )}

      <div className="facet__scroll">
        {grouped
          ? Object.entries(graph.categories).map(([catId, catTitle]) => {
              const ids = grouped[catId];
              if (!ids || ids.length === 0) return null;
              return (
                <div key={catId} className="role-group">
                  <h4 style={{ color: CATEGORY_COLORS[catId] }}>{catTitle}</h4>
                  <ul className="list">{ids.map(renderRole)}</ul>
                </div>
              );
            })
          : visibleRoleIds.length > 0 && <ul className="list">{visibleRoleIds.map(renderRole)}</ul>}
      </div>
    </div>
  );
}

import type { FeederRole, PathwaysData } from "../types";

interface BackgroundFacetProps {
  pathways: PathwaysData;
  feeders: FeederRole[];
  feederId: string | null;
  onSelect: (feederId: string | null) => void;
}

export function BackgroundFacet({ pathways, feeders, feederId, onSelect }: BackgroundFacetProps) {
  const selected = pathways.feeder_roles.find((f) => f.feeder_id === feederId);

  return (
    <div className="background-facet">
      <p className="hint">Where are you coming from? See the Work Roles people in that position move into.</p>
      {feeders.length === 0 ? (
        <p className="empty">No matching backgrounds.</p>
      ) : (
        <ul className="list facet__scroll">
          {feeders.map((feeder) => (
            <li key={feeder.feeder_id}>
              <button
                type="button"
                className={"role-row" + (feeder.feeder_id === feederId ? " role-row--focused" : "")}
                aria-pressed={feeder.feeder_id === feederId}
                onClick={() => onSelect(feeder.feeder_id === feederId ? null : feeder.feeder_id)}
              >
                <span className="role-row__title">{feeder.feeder_title}</span>
                <span className="badge">{feeder.targets.length}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected && <p className="hint hint--detail">{selected.typical_background}</p>}
    </div>
  );
}

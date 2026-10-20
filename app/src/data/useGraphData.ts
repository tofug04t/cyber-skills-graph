import { useEffect, useState } from "react";
import type { GraphData, JobTitlesData, PathwaysData } from "../types";

interface DataState {
  graph: GraphData | null;
  jobTitles: JobTitlesData | null;
  pathways: PathwaysData | null;
  error: string | null;
}

const EMPTY: DataState = { graph: null, jobTitles: null, pathways: null, error: null };

function fetchJson<T>(name: string): Promise<T> {
  return fetch(`${import.meta.env.BASE_URL}data/${name}`).then((r) => {
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    return r.json();
  });
}

export function useGraphData(): DataState {
  const [state, setState] = useState<DataState>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchJson<GraphData>("skills-graph.json"),
      fetchJson<JobTitlesData>("work-role-job-titles.json"),
      fetchJson<PathwaysData>("adjacent-role-pathways.json"),
    ])
      .then(([graph, jobTitles, pathways]) => {
        if (!cancelled) setState({ graph, jobTitles, pathways, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ ...EMPTY, error: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

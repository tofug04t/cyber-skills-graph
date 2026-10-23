import { useState } from "react";
import type { Assessment, GraphData } from "../types";
import type { QuizData, QuizSuggestion } from "../quiz";
import { QuizDialog } from "./QuizDialog";

interface QuizEntryProps {
  graph: GraphData;
  assessment: Assessment;
  onApply: (suggestions: QuizSuggestion[]) => void;
}

/** The header button and its dialog. The quiz data loads the first time the dialog opens. */
export function QuizEntry({ graph, assessment, onApply }: QuizEntryProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<QuizData | null>(null);
  const [error, setError] = useState(false);

  const show = () => {
    setOpen(true);
    if (data) return;
    setError(false);
    fetch(`${import.meta.env.BASE_URL}data/role-quiz.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<QuizData>;
      })
      .then(setData)
      .catch(() => setError(true));
  };

  return (
    <>
      <button type="button" className="quiz-button" onClick={show}>
        Role quiz
      </button>
      <QuizDialog
        open={open}
        data={data}
        error={error}
        graph={graph}
        assessment={assessment}
        onClose={() => setOpen(false)}
        onFinish={(suggestions) => {
          setOpen(false);
          onApply(suggestions);
        }}
      />
    </>
  );
}

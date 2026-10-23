import { useEffect, useRef, useState } from "react";
import type { Assessment, GraphData } from "../types";
import {
  EMPTY_ANSWERS,
  shouldSkipActivity,
  suggestRoles,
  type QuizAnswers,
  type QuizData,
  type QuizSuggestion,
  type Rating,
} from "../quiz";

const PARTS = ["Background", "Appetite", "Interests"] as const;
const RATINGS: { value: Rating; label: string }[] = [
  { value: "no", label: "Not really" },
  { value: "some", label: "Some" },
  { value: "yes", label: "Comfortable" },
];

interface QuizDialogProps {
  open: boolean;
  data: QuizData | null;
  error: boolean;
  graph: GraphData;
  assessment: Assessment;
  onClose: () => void;
  onFinish: (suggestions: QuizSuggestion[]) => void;
}

function Radios({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset className="quiz__group">
      <legend>{legend}</legend>
      <div className="quiz__options">
        {options.map((o) => (
          <label key={o.id} className="quiz__option">
            <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function QuizDialog({ open, data, error, graph, assessment, onClose, onFinish }: QuizDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY_ANSWERS);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // every run starts fresh; nothing is carried between runs
      setStep(0);
      setAnswers(EMPTY_ANSWERS);
      setNotice(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const set = (patch: Partial<QuizAnswers>) => setAnswers((a) => ({ ...a, ...patch }));

  const toggle = (key: "picked" | "excluded", id: string) => {
    const other = key === "picked" ? "excluded" : "picked";
    setAnswers((a) => ({
      ...a,
      [key]: a[key].includes(id) ? a[key].filter((x) => x !== id) : [...a[key], id],
      [other]: a[other].filter((x) => x !== id),
    }));
  };

  const finish = () => {
    if (!data) return;
    const suggestions = suggestRoles(graph, data, answers, assessment);
    if (suggestions.length === 0) {
      setNotice("Answer at least one question about your background or interests, so there is something to suggest.");
      return;
    }
    onFinish(suggestions);
  };

  const last = step === PARTS.length - 1;
  const skipped = data?.background.activities.items.filter((a) =>
    shouldSkipActivity(a, assessment, data.scoring.adaptiveSkip)
  );

  return (
    <dialog
      ref={ref}
      className="about quiz"
      aria-labelledby="quiz-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="about__content">
        <div className="about__header">
          <h2 id="quiz-title">Find roles to explore</h2>
          <button type="button" className="link-button" onClick={onClose}>
            Close
          </button>
        </div>

        {error && <p>The quiz could not be loaded. Try again in a moment.</p>}
        {!error && !data && <p>Loading...</p>}

        {data && (
          <>
            <p className="quiz__progress">
              Part {step + 1} of {PARTS.length}: {PARTS[step]}. Every question is optional, and nothing changes until
              you show the suggestions.
            </p>

            {step === 0 && (
              <>
                <Radios
                  name="quiz-field"
                  legend={data.background.field.question}
                  options={data.background.field.options}
                  value={answers.field}
                  onChange={(id) => set({ field: id })}
                />
                <h3 className="subheading">{data.background.activities.question}</h3>
                {skipped && skipped.length > 0 && (
                  <p className="hint">Skipped {skipped.length} you have already covered with your ratings.</p>
                )}
                {data.background.activities.items
                  .filter((a) => !skipped?.includes(a))
                  .map((a) => (
                    <fieldset key={a.id} className="quiz__group quiz__group--rating">
                      <legend>{a.text}</legend>
                      <div className="quiz__segments">
                        {RATINGS.map((r) => (
                          <label key={r.value} className="quiz__segment">
                            <input
                              type="radio"
                              name={`quiz-${a.id}`}
                              checked={answers.activities[a.id] === r.value}
                              onChange={() => set({ activities: { ...answers.activities, [a.id]: r.value } })}
                            />
                            <span>{r.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
              </>
            )}

            {step === 1 && (
              <>
                <Radios
                  name="quiz-time"
                  legend={data.appetite.time.question}
                  options={data.appetite.time.options}
                  value={answers.time}
                  onChange={(id) => set({ time: id })}
                />
                <Radios
                  name="quiz-coding"
                  legend={data.appetite.coding.question}
                  options={data.appetite.coding.options}
                  value={answers.coding}
                  onChange={(id) => set({ coding: id })}
                />
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="subheading">{data.interests.pickQuestion}</h3>
                <div className="quiz__cards">
                  {data.interests.cards.map((c) => {
                    const picked = answers.picked.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={"quiz__card" + (picked ? " quiz__card--on" : "")}
                        aria-pressed={picked}
                        disabled={!picked && answers.picked.length >= data.interests.maxPick}
                        onClick={() => toggle("picked", c.id)}
                      >
                        {c.text}
                      </button>
                    );
                  })}
                </div>
                <h3 className="subheading">{data.interests.excludeQuestion}</h3>
                <div className="quiz__cards">
                  {data.interests.cards.map((c) => {
                    const excluded = answers.excluded.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={"quiz__card quiz__card--no" + (excluded ? " quiz__card--on" : "")}
                        aria-pressed={excluded}
                        disabled={answers.picked.includes(c.id)}
                        onClick={() => toggle("excluded", c.id)}
                      >
                        {c.text}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {notice && (
              <p className="quiz__notice" role="status">
                {notice}
              </p>
            )}

            <div className="quiz__footer">
              {step > 0 && (
                <button type="button" className="link-button" onClick={() => setStep(step - 1)}>
                  Back
                </button>
              )}
              <span className="quiz__spacer" />
              {!last && (
                <button type="button" className="link-button" onClick={() => setStep(step + 1)}>
                  Skip this part
                </button>
              )}
              <button type="button" className="quiz__primary" onClick={last ? finish : () => setStep(step + 1)}>
                {last ? "Show suggestions" : "Next"}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

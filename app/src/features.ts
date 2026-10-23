// Feature switches. Flip a value and rebuild: a feature that is `false` is not shipped.
export const FEATURES = {
  /** Optional intake quiz that suggests roles (see decision log). */
  quiz: false,
} as const;

export type VisualRole =
  "IRRELEVANT" | "RELATED" | "TARGET" | "PROTECTED" | "DESTINATION" | "MOVING";
export interface Attention {
  target?: string;
  related: string[];
  protected: string[];
  muted: boolean;
  emphasizeTarget?: boolean;
}
export function roleFor(id: string, a: Attention): VisualRole {
  return id === a.target
    ? "TARGET"
    : a.protected.includes(id)
      ? "PROTECTED"
      : !a.muted || a.related.includes(id)
        ? "RELATED"
        : "IRRELEVANT";
}

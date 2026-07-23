// Tooltip value formatter compatible with Recharts 3's Formatter type.
// Accepting `unknown` satisfies the (ValueType, ...) signature via contravariance,
// and String() safely renders whatever value Recharts passes in.
export const unit =
  (suffix: string) =>
  (v: unknown): string =>
    `${String(v)} ${suffix}`

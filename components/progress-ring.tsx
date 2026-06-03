export function ProbabilityBar({ value }: { value: number }) {
  return (
    <div className="min-w-28">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>{value}%</span>
        <span>{value >= 75 ? "strong" : value >= 45 ? "active" : "low"}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

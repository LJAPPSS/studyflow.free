export type BarChartBar = { key: string; label: string; height: number; value?: string };

type BarChartProps = { bars: BarChartBar[] };

export function BarChart({ bars }: BarChartProps) {
  return (
    <div className="flex h-28 items-end gap-2">
      {bars.map((bar, index) => (
        <div key={bar.key} className="flex h-full flex-1 flex-col justify-end gap-1.5" title={bar.value ? `${bar.label}: ${bar.value}` : bar.label}>
          <div
            className="w-full origin-bottom animate-bar-grow rounded-xl bg-neutral-900/85 transition-colors duration-300 hover:bg-neutral-900 dark:bg-neutral-100/85"
            style={{ height: `${bar.height}%`, animationDelay: `${index * 70}ms` }}
          />
          <span className="truncate text-center text-[11px] font-medium text-neutral-600">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

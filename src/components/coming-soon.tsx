export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center">
        <span className="rounded-full border border-warn/40 bg-warn/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wide text-warn">
          Coming soon
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-ink-2">{description}</p>
      </div>
    </div>
  );
}

export function LogoBadge({ title = "MVP" }: { title?: string }) {
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-900">
      <span className="text-center text-sm font-bold leading-tight text-white">
        {title}
      </span>
    </div>
  );
}

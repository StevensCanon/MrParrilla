export default function MenusLoading() {
    return (
      <div className="divide-y divide-zinc-100">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="animate-pulse px-5 py-5 sm:px-6"
          >
            <div className="h-4 w-40 rounded bg-zinc-200" />
  
            <div className="mt-3 h-3 w-64 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    );
  }
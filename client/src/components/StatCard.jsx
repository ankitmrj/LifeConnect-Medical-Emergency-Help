// StatCard Component
export default function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      {/* Card Content */}
      <div className="flex items-center justify-between">

        {/* Label and Value */}
        <div>
          <div className="text-sm text-slate-500">
            {label}
          </div>

          <div className="mt-1 text-3xl font-black">
            {value}
          </div>
        </div>

        {/* Optional Icon */}
        {Icon && (
          <Icon className="text-slate-400" />
        )}

      </div>
    </div>
  );
}

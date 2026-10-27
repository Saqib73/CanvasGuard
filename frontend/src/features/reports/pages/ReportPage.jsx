export default function ReportPage() {
  return (
    <div className="h-full overflow-y-auto no-scrollbar p-6">
      <div className="sticky top-0 z-10 backdrop-blur bg-base-100/80 border-b border-base-300 pb-3 mb-6 font-semibold text-lg">
        Report Art Theft
      </div>
      <div className="max-w-xl bg-base-200 border border-base-300 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-2">Report Content</h2>
        <p className="text-sm opacity-70 mb-4">
          CanvasGuard protects artist rights and intellectual property. If you believe your artwork has been stolen or used without proper license/attribution, submit a report here.
        </p>
        <p className="text-xs opacity-50">Feature coming soon.</p>
      </div>
    </div>
  );
}

export const Report = ReportPage;

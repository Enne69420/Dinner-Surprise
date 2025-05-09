export default function PricingLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-(rgb(var(--green-600))) border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-medium text-(rgb(var(--green-700)))">Loading pricing information...</h2>
      </div>
    </div>
  );
} 
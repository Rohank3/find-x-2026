export default function HuntLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-6 font-mono">
      <div className="border border-[hsl(45_40%_97%/0.12)] bg-black/60 p-6 backdrop-blur-md animate-pulse flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-[hsl(45_40%_97%/0.15)]" />
          <div className="h-3 w-36 bg-[hsl(45_40%_97%/0.08)]" />
        </div>
        <div className="h-8 w-32 bg-[hsl(45_40%_97%/0.1)]" />
      </div>
      <div className="h-96 border border-[hsl(45_40%_97%/0.08)] bg-black/40 p-8 animate-pulse space-y-4">
        <div className="h-6 w-3/4 bg-[hsl(45_40%_97%/0.15)]" />
        <div className="h-4 w-full bg-[hsl(45_40%_97%/0.08)]" />
        <div className="h-4 w-2/3 bg-[hsl(45_40%_97%/0.08)]" />
      </div>
    </div>
  );
}

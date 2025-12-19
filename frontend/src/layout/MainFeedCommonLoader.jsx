import { CardSkeleton } from "./LayoutLoader";

export const MainFeedCommonLoader = () => {
  return (
    <>
      <main className="col-span-7 border-r border-neutral-800 p-6 space-y-6 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} className="h-48 w-full" />
        ))}
      </main>
    </>
  );
};

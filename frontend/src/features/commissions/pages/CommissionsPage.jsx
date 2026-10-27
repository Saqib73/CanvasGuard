import { useState } from "react";
import { Link } from "react-router-dom";
import { useCommissionArtists } from "../api/commissions.hooks";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ArtistGridSkeleton } from "../../../components/ui/Skeleton";

import { getAvatarUrl } from "../../../lib/avatar";
export default function CommissionsPage() {
  const [filters, setFilters] = useState({
    open: "",
    style: "",
    minFee: "",
    maxFee: "",
    sort: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({});

  const { data, isLoading } = useCommissionArtists(appliedFilters);
  const artists = data?.artists || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilter = (e) => {
    e.preventDefault();
    const cleanFilters = {};
    for (const key in filters) {
      if (filters[key]) cleanFilters[key] = filters[key];
    }
    setAppliedFilters(cleanFilters);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar max-w-5xl mx-auto p-6">
      <div className="sticky top-0 z-10 backdrop-blur bg-base-100/80 py-3 mb-6 border-b border-base-300">
        <h1 className="text-2xl font-bold">Artist Commissions</h1>
      </div>

      <form
        onSubmit={handleFilter}
        className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"
      >
        <select
          name="open"
          value={filters.open}
          onChange={handleChange}
          className="rounded-xl p-2 bg-base-200 border border-base-300 text-sm focus:outline-none"
        >
          <option value="">Status: All</option>
          <option value="true">Open</option>
          <option value="false">Closed</option>
        </select>
        <input
          type="text"
          name="style"
          value={filters.style}
          placeholder="Art style"
          className="rounded-xl p-2 bg-base-200 border border-base-300 text-sm focus:outline-none"
          onChange={handleChange}
        />
        <input
          type="number"
          name="minFee"
          value={filters.minFee}
          placeholder="Min fee"
          className="rounded-xl p-2 bg-base-200 border border-base-300 text-sm focus:outline-none"
          onChange={handleChange}
        />
        <input
          type="number"
          name="maxFee"
          value={filters.maxFee}
          placeholder="Max fee"
          className="rounded-xl p-2 bg-base-200 border border-base-300 text-sm focus:outline-none"
          onChange={handleChange}
        />
        <select
          name="sort"
          value={filters.sort}
          onChange={handleChange}
          className="rounded-xl p-2 bg-base-200 border border-base-300 text-sm focus:outline-none"
        >
          <option value="">Sort</option>
          <option value="fee_low">Lowest fee</option>
          <option value="fee_high">Highest fee</option>
          <option value="newest">Newest</option>
        </select>
        <Button
          type="submit"
          className="col-span-full"
        >
          Apply Filters
        </Button>
      </form>

      {isLoading ? (
        <ArtistGridSkeleton />
      ) : artists.length === 0 ? (
        <EmptyState
          title="No artists found"
          description="Try adjusting your filters to discover artists open for commissions."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {artists.map((a) => (
            <Card key={a._id} className="flex flex-col justify-between">
              <div>
                <Link to={`/artist/${a.user?.userName}`} className="flex items-center gap-3 mb-3">
                  <img
                    src={getAvatarUrl(a.user)}
                    alt={a.user?.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <h2 className="font-semibold text-base hover:underline">{a.user?.name}</h2>
                    <p className="text-xs opacity-60">@{a.user?.userName}</p>
                  </div>
                </Link>
                <p className="text-sm opacity-80 mb-2">
                  {a?.artStyles?.join(", ")}
                </p>
                <p className="text-sm font-medium">Base fee: ₹{a.baseFee}</p>
                {a.openForCommission ? (
                  <span className="text-success text-xs font-medium block mt-1">
                    ● Open for commissions
                  </span>
                ) : (
                  <span className="opacity-50 text-xs font-medium block mt-1">
                    ○ Closed for commissions
                  </span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-base-300">
                <Link to={`/commissions/${a._id}`} className="block w-full">
                  <Button variant="secondary" size="sm" className="w-full">
                    Request Commission
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const Commissions = CommissionsPage;

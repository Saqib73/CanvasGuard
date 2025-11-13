import { useState, useEffect } from "react";
import axios from "axios";
import { dummyArtists } from "./dummyArtist";

export default function Commissions() {
  const [artists, setArtists] = useState(dummyArtists);
  console.log(artists);
  const [filters, setFilters] = useState({
    open: "",
    style: "",
    minFee: "",
    maxFee: "",
    sort: "",
  });

  const fetchArtists = async () => {
    const params = new URLSearchParams();
    console.log(params);
    for (const key in filters) {
      if (filters[key]) params.append(key, filters[key]);
    }

    const res = await axios.get(
      `${
        import.meta.env.VITE_SERVER
      }/api/v1/commissions/get?${params.toString()}`,
      {
        withCredentials: true,
      }
    );
    setArtists(res.data.artists);
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchArtists();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <form
        onSubmit={handleFilter}
        className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"
      >
        <select name="open" onChange={handleChange} className="rounded-md p-1">
          <option value="">All</option>
          <option value="true">Open</option>
          <option value="false">Closed</option>
        </select>
        <input
          type="text"
          name="style"
          placeholder="Art style"
          className="rounded-md p-1"
          onChange={handleChange}
        />
        <input
          type="number"
          name="minFee"
          placeholder="Min fee"
          className="rounded-md p-1"
          onChange={handleChange}
        />
        <input
          type="number"
          name="maxFee"
          placeholder="Max fee"
          className="rounded-md p-1"
          onChange={handleChange}
        />
        <select name="sort" onChange={handleChange} className="rounded-md p-1">
          <option value="">Sort</option>
          <option value="fee_low">Lowest fee</option>
          <option value="fee_high">Highest fee</option>
          <option value="newest">Newest</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-3 py-1 col-span-full"
        >
          Apply Filters
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {artists?.map((a) => (
          <div key={a.id} className="border p-4 rounded shadow">
            <img
              src={a.user?.profilePic?.url || "/default.png"}
              alt={a.user?.name}
              className="w-20 h-20 rounded-full object-cover mb-2"
            />
            <h2 className="font-semibold">{a.user?.name}</h2>
            <p className="text-sm text-gray-600">{a?.artStyles?.join(", ")}</p>
            <p>Base fee: ₹{a.baseFee}</p>
            {a.isOpenForCommission && (
              <span className="text-green-600 text-sm font-medium">
                Open for commissions
              </span>
            )}
            <button className="mt-2 bg-gray-800 text-white text-sm px-3 py-1 rounded">
              Request Commission
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

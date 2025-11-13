import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setArtIspending, userExists } from "../../redux/reducers/auth";
import { FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function SignupForm({ setIsLogin }) {
  const [form, setForm] = useState({
    name: "",
    userName: "",
    password: "",
    confirmPassword: "",
    email: "",
    isArtist: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [profilePic, setProfilePic] = useState();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Signing Up...");
    setIsLoading(true);
    try {
      const formData = new FormData();
      for (const key in form) {
        formData.append(key, form[key]);
      }
      if (profilePic) formData.append("profile", profilePic);
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER}/api/v1/auth/signup`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      console.log("data-->", data);

      dispatch(setArtIspending(true));
      if (window.location.pathname !== "/setup") {
        console.log(window.location.pathname);
        navigate("/setup");
      }
      toast.success(data.message, {
        id: toastId,
      });
    } catch (err) {
      console.error(err);
      toast.success(err.response?.data?.message || "Something went wrong", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(form);
  }, [form]);

  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-4 lg:px-8 overflow-x-scroll">
      {/* <div className="sm:mx-auto sm:w-full sm:max-w-sm flex items-center justify-center">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
          Create your account
        </h2>
      </div> */}

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSignup}>
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={
                  profilePic
                    ? URL.createObjectURL(profilePic)
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Profile preview"
                className="w-[8rem] h-[8rem] rounded-full object-cover border border-gray-700"
              />
              <label
                htmlFor="profilePic"
                className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 p-2 rounded-full cursor-pointer shadow-md"
              >
                <FaCamera className="text-white text-sm" />
                <input
                  id="profilePic"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePic(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-400">Upload Profile Picture</p>
          </div>

          {/* Names */}
          <div className="flex gap-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm/6 font-medium text-gray-100"
              >
                Full Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="userName"
                className="block text-sm/6 font-medium text-gray-100"
              >
                Username
              </label>
              <div className="mt-2">
                <input
                  id="userName"
                  name="userName"
                  type="text"
                  required
                  value={form.userName}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex gap-2">
            <div>
              <label
                htmlFor="password"
                className="block text-sm/6 font-medium text-gray-100"
              >
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="comfirmPassword"
                className="block text-sm/6 font-medium text-gray-100"
              >
                Confirm Password
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm/6 font-medium text-gray-100"
            >
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isArtist"
              name="isArtist"
              type="checkbox"
              checked={form.isArtist}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label
              htmlFor="isArtist"
              className="text-sm font-medium text-gray-100"
            >
              I’m an artist
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
              {isLoading ? "Signing up..." : "Sign up"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm/6 text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => setIsLogin(true)}
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

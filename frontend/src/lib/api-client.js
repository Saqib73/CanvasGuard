import axios from "axios";

export const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER}/api/v1`,
  withCredentials: true,
});

export const getErrorMessage = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || fallback;

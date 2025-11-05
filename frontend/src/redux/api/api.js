import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1`,
  }),
  tagTypes: ["Post"],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => ({
        url: "/posts",
        credentials: "include",
      }),
      providesTags: ["Post"],
    }),
    getPost: builder.query({
      query: ({ postId }) => ({
        url: `/posts/${postId}`,
        credentials: "include",
      }),
    }),
    getComments: builder.mutation({
      query: (data) => ({
        url: "/comment",
        method: "POST",
        credentials: "include",
        body: data,
      }),
    }),
  }),
});

export default api;

export const { useGetPostsQuery, useGetPostQuery, useGetCommentsMutation } =
  api;

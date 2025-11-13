import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SERVER}/api/v1`,
  }),
  tagTypes: ["Post", "MyPost", "LikedPosts", "Profile"],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: (params) => {
        const query = new URLSearchParams(params).toString();
        return {
          url: `/posts${query ? `?${query}` : ""}`,
          credentials: "include",
        };
      },
      providesTags: ["Post"],
    }),
    getPost: builder.query({
      query: ({ postId }) => ({
        url: `/posts/${postId}`,
        credentials: "include",
      }),
    }),
    updateProfile: builder.mutation({
      query: (formData) => ({
        url: "/user/me",
        method: "PUT",
        body: formData,
        credentials: "include",
      }),
      invalidatesTags: ["Post", "Profile"], // 👈 this ensures cache is refreshed
    }),
    getComments: builder.mutation({
      query: (data) => ({
        url: "/comment",
        method: "POST",
        credentials: "include",
        body: data,
      }),
    }),
    getMyPosts: builder.query({
      query: () => ({
        url: "/posts/getMyPosts",
        credentials: "include",
      }),
      providesTags: ["MyPost"],
    }),
    sendLike: builder.mutation({
      query: (data) => ({
        url: "/posts/like",
        method: "POST",
        body: data,
        credentials: "include",
      }),
      invalidatesTags: ["Post", "LikedPosts"],
    }),
    disLike: builder.mutation({
      query: (data) => ({
        url: "/posts/unlike",
        method: "POST",
        body: data,
        credentials: "include",
      }),
      invalidatesTags: ["Post", "LikedPosts"],
    }),
    getUserProfile: builder.query({
      query: ({ userName }) => ({
        url: `/user/${userName}`,
        credentials: "include",
      }),
      providesTags: ["Profile"],
    }),
    getAllLikedPosts: builder.query({
      query: () => ({
        url: "/user/getLikedPosts",
        credentials: "include",
      }),
      providesTags: ["LikedPosts"],
    }),
    deletePost: builder.mutation({
      query: ({ postId, isStolen }) => ({
        url: `/posts/${postId}`,
        credentials: "include",
        method: "DELETE",
        body: { isStolen },
      }),
      invalidatesTags: ["Post"],
    }),
    followUser: builder.mutation({
      query: ({ targetId }) => ({
        url: "/user/follow",
        credentials: "include",
        method: "POST",
        body: { targetId },
      }),
      invalidatesTags: ["Profile"],
    }),
    unFollowUser: builder.mutation({
      query: ({ targetId }) => ({
        url: "/user/unfollow",
        credentials: "include",
        method: "POST",
        body: { targetId },
      }),
      invalidatesTags: ["Profile"],
    }),
    createPost: builder.mutation({
      query: ({ description, isArt }) => ({
        url: "/posts/createPost",
        credentials: "include",
        method: "POST",
        body: { description, isArt },
      }),
      invalidatesTags: ["Post"],
    }),
  }),
});

export default api;

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useGetCommentsMutation,
  useGetMyPostsQuery,
  useSendLikeMutation,
  useDisLikeMutation,
  useGetUserProfileQuery,
  useGetAllLikedPostsQuery,
  useDeletePostMutation,
  useFollowUserMutation,
  useUnFollowUserMutation,
  useCreatePostMutation,
  useUpdateProfileMutation,
} = api;

export const routes = {
  home: "/",
  listings: "/listings",
  listingDetails: (id: string) => `/listings/${id}`,

  login: "/login",
  register: "/register",

  dashboard: "/dashboard",
  saved: "/saved",
  profile: "/profile",

  admin: "/admin",
  adminUsers: "/admin/users",
  adminListings: "/admin/listings",
} as const;

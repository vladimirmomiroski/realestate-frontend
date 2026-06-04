import { routes } from "./routes";

export const publicNavigation = [
  {
    label: "Listings",
    href: routes.listings,
  },
] as const;

export const authNavigation = [
  {
    label: "Login",
    href: routes.login,
  },
  {
    label: "Register",
    href: routes.register,
  },
] as const;

export const dashboardNavigation = [
  {
    label: "Dashboard",
    href: routes.dashboard,
  },
  {
    label: "Saved",
    href: routes.saved,
  },
  {
    label: "Profile",
    href: routes.profile,
  },
] as const;

export const adminNavigation = [
  {
    label: "Admin",
    href: routes.admin,
  },
  {
    label: "Users",
    href: routes.adminUsers,
  },
  {
    label: "Listings",
    href: routes.adminListings,
  },
] as const;

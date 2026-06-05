import type { NavigationKey } from "@/i18n";
import { routes } from "./routes";

type NavigationItem = {
  labelKey: NavigationKey;
  href: string;
};

export const publicNavigation = [
  {
    labelKey: "listings",
    href: routes.listings,
  },
] as const satisfies readonly NavigationItem[];

export const authNavigation = [
  {
    labelKey: "login",
    href: routes.login,
  },
  {
    labelKey: "register",
    href: routes.register,
  },
] as const satisfies readonly NavigationItem[];

export const dashboardNavigation = [
  {
    labelKey: "dashboard",
    href: routes.dashboard,
  },
  {
    labelKey: "saved",
    href: routes.saved,
  },
  {
    labelKey: "profile",
    href: routes.profile,
  },
] as const satisfies readonly NavigationItem[];

export const adminNavigation = [
  {
    labelKey: "admin",
    href: routes.admin,
  },
  {
    labelKey: "users",
    href: routes.adminUsers,
  },
  {
    labelKey: "listings",
    href: routes.adminListings,
  },
] as const satisfies readonly NavigationItem[];

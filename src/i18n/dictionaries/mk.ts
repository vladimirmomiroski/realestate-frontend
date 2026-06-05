import type { Dictionary } from "./types";

export const mk = {
  common: {
    appName: "Real Estate Frontend",
  },

  navigation: {
    listings: "Огласи",
    login: "Најава",
    register: "Регистрација",
    dashboard: "Контролна табла",
    saved: "Зачувани",
    profile: "Профил",
    admin: "Админ",
    users: "Корисници",
  },

  home: {
    eyebrow: "Платформа за интелигентно пребарување недвижности",
    title: "Најди станови и разбери ја нивната вистинска вредност.",
    description:
      "Попаметно пребарување станови со фокус на споредби, ценовни увиди и подобри одлуки при купување.",
  },

  theme: {
    toggle: "Промени тема",
    light: "Светол режим",
    dark: "Темeн режим",
  },
} satisfies Dictionary;

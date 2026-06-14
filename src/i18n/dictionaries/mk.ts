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
  listings: {
    title: "Огласи",
    subtitle:
      "Пребарувај домови за продажба и изнајмување низ Северна Македонија.",
    filters: "Филтри",
    results: "Резултати",
    emptyTitle: "Нема пронајдени огласи",
    emptyDescription: "Обидете се со промена на филтрите или локацијата.",
    listingType: "Тип на оглас",
    propertyType: "Тип на имот",
    price: "Цена",
    minPrice: "Минимална цена",
    maxPrice: "Максимална цена",
    area: "Површина",
    pricePerSquareMeter: "Цена по квадратен метар",
    rooms: "Соби",
    bathrooms: "Бањи",
    floor: "Кат",
    city: "Град",
    neighborhood: "Населба",
    status: "Статус",
    search: "Пребарај",
    reset: "Ресетирај",
    previousPage: "Претходна страница",
    nextPage: "Следна страница",
    page: "Страница",
    totalResults: "Вкупно резултати",
    notSpecified: "Не е наведено",
    listingTypes: {
      Sale: "Продажба",
      Rent: "Изнајмување",
    },
    propertyTypes: {
      Apartment: "Стан",
      House: "Куќа",
    },
    statuses: {
      Draft: "Нацрт",
      Active: "Активен",
      Reserved: "Резервиран",
      Sold: "Продаден",
      Rented: "Изнајмен",
      Archived: "Архивиран",
    },
  },
} satisfies Dictionary;

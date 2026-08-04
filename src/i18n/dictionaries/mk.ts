import type { Dictionary } from "./types";

export const mk = {
  common: {
    appName: "Недвижности",
  },

  metadata: {
    home: {
      title: "Недвижности во Северна Македонија",
      description:
        "Откријте домови за продажба и изнајмување низ Северна Македонија со јасни информации за имотот.",
    },
  },

  navigation: {
    home: "Почетна",
    listings: "Огласи",
  },

  home: {
    eyebrow: "Недвижности во Северна Македонија",
    title: "Пронајдете дом што одговара на вашите планови.",
    description:
      "Истражете домови за продажба и изнајмување со јасни податоци, структурирани филтри и цена по квадратен метар.",
  },

  theme: {
    label: "Тема",
    system: "Системска",
    light: "Светла",
    dark: "Темна",
  },

  locale: {
    label: "Јазик",
    mk: "Македонски",
    en: "English",
  },

  errors: {
    genericTitle: "Настана грешка",
    genericDescription: "Обидете се повторно.",
    retry: "Обиди се повторно",
    requestIdLabel: "Идентификатор за поддршка",
    copyRequestId: "Копирај го идентификаторот",
  },

  accessibility: {
    skipToContent: "Прескокни до содржината",
    openMenu: "Отвори мени",
    closeMenu: "Затвори мени",
  },

  listings: {
    title: "Огласи",
    subtitle:
      "Пребарувајте домови за продажба и изнајмување низ Северна Македонија.",
    filters: "Филтри",
    results: "Резултати",
    emptyTitle: "Нема пронајдени огласи",
    emptyDescription: "Променете ги филтрите или локацијата.",
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

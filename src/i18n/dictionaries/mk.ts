import type { Dictionary } from "./types";

export const mk = {
  common: {
    appName: "Недвижности",
    footerText: "Јасно пребарување на недвижности во Северна Македонија.",
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
    featuresLabel: "Што можете да истражите",
    discoveryTitle: "Пребарување недвижности",
    discoveryDescription:
      "Прегледајте фокусиран каталог на домови за продажба и изнајмување.",
    filtersTitle: "Структурирани филтри",
    filtersDescription:
      "Стеснете ги идните резултати според практични критериуми за имот.",
    priceTitle: "Споредливи цени",
    priceDescription:
      "Прегледајте ја наведената цена по квадратен метар со податоците за имотот.",
    browseListings: "Прегледај огласи",
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
    requestIdCopied: "Идентификаторот е копиран.",
    requestIdCopyFailed:
      "Копирањето не успеа. Означете го и копирајте го идентификаторот погоре.",
    notFoundTitle: "Страницата не е пронајдена",
    notFoundDescription: "Бараната страница не може да се пронајде.",
    backHome: "Назад на почетна",
  },

  accessibility: {
    skipToContent: "Прескокни до содржината",
    openMenu: "Отвори мени",
    closeMenu: "Затвори мени",
    primaryNavigation: "Главна навигација",
  },

  listings: {
    failure: {
      title: "Имотите не може да се вчитаат",
      validation:
        "Пребарувањето не може да се обработи. Обидете се повторно или променете го пребарувањето.",
      server: "Настана проблем со серверот. Обидете се повторно.",
      http: "Имотите не може да се вчитаат. Обидете се повторно.",
      malformed:
        "Добиените податоци за имотите не може да се прикажат. Обидете се повторно.",
      network: "Поврзувањето не успеа. Обидете се повторно.",
    },
    title: "Огласи",
    subtitle:
      "Пребарувајте домови за продажба и изнајмување низ Северна Македонија.",
    filters: "Филтри",
    results: "Резултати",
    emptyTitle: "Нема имоти што одговараат на пребарувањето",
    emptyDescription:
      "Обидете се со друг поим или променете го типот на оглас или имот.",
    catalogEmptyTitle: "Моментално нема достапни имоти",
    catalogEmptyDescription: "Во каталогот моментално нема имоти.",
    emptyPageTitle: "Нема резултати на оваа страница",
    emptyPageDescription:
      "На оваа страница нема огласи. Вратете се на првата страница за да ги видите имотите што одговараат на пребарувањето.",
    firstPage: "Назад на првата страница",
    listingType: "Тип на оглас",
    propertyType: "Тип на имот",
    allListingTypes: "Сите типови на огласи",
    allPropertyTypes: "Сите типови на имоти",
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
    searchLabel: "Клучен збор или локација",
    searchHint: "Внесете од 2 до 100 знаци или оставете празно за сите огласи.",
    searchTooShort: "Внесете најмалку 2 знака.",
    searchTooLong: "Внесете најмногу 100 знаци.",
    searchRepeated: "Внесете само еден поим за пребарување.",
    searchInvalidSummary:
      "Проверете го поимот за пребарување и обидете се повторно.",
    clearSearch: "Исчисти пребарување",
    reset: "Ресетирај",
    previousPage: "Претходна страница",
    nextPage: "Следна страница",
    page: "Страница",
    pagination: "Страници со резултати",
    navigationPending: "Се вчитува…",
    pageOf: "Страница {page} од {totalPages}",
    totalResults: "Вкупно резултати",
    resultCount: {
      zero: "Пронајдени имоти: 0",
      one: "Пронајден е 1 имот",
      many: "Пронајдени имоти: {count}",
    },
    notSpecified: "Не е наведено",
    imageUnavailable: "Сликата не е достапна",
    listingTypes: {
      Sale: "Продажба",
      Rent: "Изнајмување",
    },
    propertyTypes: {
      Apartment: "Стан",
      House: "Куќа",
      Commercial: "Деловен простор",
      Land: "Земјиште",
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

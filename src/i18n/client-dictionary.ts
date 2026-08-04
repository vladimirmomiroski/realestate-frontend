import type { ClientDictionary, Dictionary } from "./dictionaries/types";

export function getClientDictionary(dictionary: Dictionary): ClientDictionary {
  return {
    common: dictionary.common,
    navigation: dictionary.navigation,
    theme: dictionary.theme,
    locale: dictionary.locale,
    errors: dictionary.errors,
    accessibility: dictionary.accessibility,
  };
}

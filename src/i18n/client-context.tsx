"use client";

import { createContext, useContext } from "react";

import type { Locale } from "./config";
import type { ClientDictionary } from "./dictionaries/types";

type ClientI18nContextValue = {
  dictionary: ClientDictionary;
  locale: Locale;
};

const ClientDictionaryContext = createContext<ClientI18nContextValue | null>(
  null
);

type ClientDictionaryProviderProps = {
  children: React.ReactNode;
  dictionary: ClientDictionary;
  locale: Locale;
};

export function ClientDictionaryProvider({
  children,
  dictionary,
  locale,
}: ClientDictionaryProviderProps) {
  return (
    <ClientDictionaryContext value={{ dictionary, locale }}>
      {children}
    </ClientDictionaryContext>
  );
}

function useClientI18n(): ClientI18nContextValue {
  const context = useContext(ClientDictionaryContext);

  if (!context) {
    throw new Error(
      "useClientDictionary must be used within ClientDictionaryProvider"
    );
  }

  return context;
}

export function useClientDictionary(): ClientDictionary {
  return useClientI18n().dictionary;
}

export function useCurrentLocale(): Locale {
  return useClientI18n().locale;
}

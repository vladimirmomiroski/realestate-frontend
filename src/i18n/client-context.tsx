"use client";

import { createContext, useContext } from "react";

import type { ClientDictionary } from "./dictionaries/types";

const ClientDictionaryContext = createContext<ClientDictionary | null>(null);

type ClientDictionaryProviderProps = {
  children: React.ReactNode;
  dictionary: ClientDictionary;
};

export function ClientDictionaryProvider({
  children,
  dictionary,
}: ClientDictionaryProviderProps) {
  return (
    <ClientDictionaryContext value={dictionary}>
      {children}
    </ClientDictionaryContext>
  );
}

export function useClientDictionary(): ClientDictionary {
  const dictionary = useContext(ClientDictionaryContext);

  if (!dictionary) {
    throw new Error(
      "useClientDictionary must be used within ClientDictionaryProvider"
    );
  }

  return dictionary;
}

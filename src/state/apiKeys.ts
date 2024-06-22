import { atom } from "jotai";

interface ApiKeys {
  OPENAI_API_KEY: string;
  HUME_API_KEY: string;
  HUME_SECRET_KEY: string;
}

export const apiKeysAtom = atom<ApiKeys>({
  OPENAI_API_KEY: "",
  HUME_API_KEY: "",
  HUME_SECRET_KEY: "",
});

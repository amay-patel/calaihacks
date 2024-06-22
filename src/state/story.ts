import { atom } from "jotai";

// Define types
export interface Page {
    text: string;
    image_url: string;
    audio_url: string;
}

export interface Story {
    pages: Page[];
}

export const storyAtom = atom<Story>({ pages: [] });

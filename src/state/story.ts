import { atom } from "jotai";
import { getAllStoryIds } from "../firebase/firebase";

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
export const allStoriesAtom = atom<string[]>([]);

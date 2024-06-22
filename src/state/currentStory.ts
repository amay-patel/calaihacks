import { atom } from "jotai";
import { imageFiles } from "../components/ImageNames";

const getRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    return `/defaultImgs/${imageFiles[randomIndex]}`;
};

export const storyTextAtom = atom("");
export const storyImageAtom = atom(getRandomImage());

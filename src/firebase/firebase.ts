import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  DocumentReference,
  DocumentSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqP4aEEew4x7BSmyxFGowLUvqy8rKA5SQ",
  authDomain: "calaihacks.firebaseapp.com",
  projectId: "calaihacks",
  storageBucket: "calaihacks.appspot.com",
  messagingSenderId: "319449088425",
  appId: "1:319449088425:web:ce722586b71dc89b3d84b8",
  measurementId: "G-Q9N1BMNPP9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Define types
interface Page {
  text: string;
  image_url: string;
  audio_url: string;
}

interface Story {
  pages: Page[];
}

// Helper function to create a new story
export const createStory = async (pages: Page[]): Promise<string> => {
  try {
    const storiesRef = collection(db, "stories");
    const newStoryRef = await addDoc(storiesRef, { pages });
    return newStoryRef.id;
  } catch (error) {
    console.error("Error creating story:", error);
    throw error;
  }
};

// Helper function to get a story by ID
export const getStory = async (storyId: string): Promise<Story | null> => {
  try {
    const storyRef: DocumentReference = doc(db, "stories", storyId);
    const storySnap: DocumentSnapshot = await getDoc(storyRef);

    if (storySnap.exists()) {
      return storySnap.data() as Story;
    } else {
      console.log("No such story!");
      return null;
    }
  } catch (error) {
    console.error("Error getting story:", error);
    throw error;
  }
};

// Helper function to update a story
export const updateStory = async (
  storyId: string,
  updatedPages: Page[]
): Promise<void> => {
  try {
    const storyRef: DocumentReference = doc(db, "stories", storyId);
    await updateDoc(storyRef, { pages: updatedPages });
  } catch (error) {
    console.error("Error updating story:", error);
    throw error;
  }
};

// Helper function to delete a story
export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    const storyRef: DocumentReference = doc(db, "stories", storyId);
    await deleteDoc(storyRef);
  } catch (error) {
    console.error("Error deleting story:", error);
    throw error;
  }
};

// Helper function to add a page to a story
export const addPageToStory = async (
  storyId: string,
  newPage: Page
): Promise<void> => {
  try {
    const storyRef: DocumentReference = doc(db, "stories", storyId);
    const storySnap: DocumentSnapshot = await getDoc(storyRef);

    if (storySnap.exists()) {
      const story = storySnap.data() as Story;
      const updatedPages = [...story.pages, newPage];
      await updateDoc(storyRef, { pages: updatedPages });
    } else {
      console.log("No such story!");
    }
  } catch (error) {
    console.error("Error adding page to story:", error);
    throw error;
  }
};
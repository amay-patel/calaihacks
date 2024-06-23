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
    QuerySnapshot,
    getDocs,
} from "firebase/firestore";
import { Page, Story } from "../state/story";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Helper function to create a new story
export const createStory = async (story: Story): Promise<string> => {
    try {
        const storiesRef = collection(db, "stories");
        const newStoryRef = await addDoc(storiesRef, story);
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

export const getAllStoryIds = async (): Promise<string[]> => {
    try {
        const storiesRef = collection(db, "stories");
        const querySnapshot: QuerySnapshot = await getDocs(storiesRef);

        const storyIds: string[] = [];

        querySnapshot.forEach((doc) => {
            storyIds.push(doc.id);
        });

        return storyIds;
    } catch (error) {
        console.error("Error getting all story IDs:", error);
        throw error;
    }
};

export { app, db as default };

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import db from '../firebase/firebase';
import { Page } from '../state/story';

const PhotoCarousel = () => {
  const { id } = useParams<{ id: string }>();
  const [pages, setPages] = useState<Page[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (id) {
      const fetchStory = async () => {
        try {
          const docRef = doc(db, 'stories', id);
          const storyDoc = await getDoc(docRef);
          if (storyDoc.exists()) {
            setPages(storyDoc.data().pages as Page[]);
          } else {
            console.log('No such document!');
          }
        } catch (error) {
          console.error('Error fetching document:', error);
        }
      };
      fetchStory();
    }
  }, [id]);
  
  const goToNextPage = () => {
    if (currentIndex < pages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log('No more pages!');
    }
  };

  const goToPreviousPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      console.log('No previous pages!');
    }
  };

  return (
    <div>
      <button onClick={goToPreviousPage}>Previous</button>
      <button onClick={goToNextPage}>Next</button>
      <img src={pages[currentIndex]?.image_url} alt="Story page" />
    </div>
  );
}

export default PhotoCarousel;
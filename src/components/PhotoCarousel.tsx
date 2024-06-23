import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Center, VStack, Image, Text, HStack, Button } from '@chakra-ui/react';
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

  const currentPage = pages[currentIndex];

  if (!currentPage) {
    return <Center>Loading...</Center>;
  }

  const { image_url, text, audio_url } = currentPage;

  return (
    <Center height="100vh" flexDirection="column">
      <VStack spacing={4}>
        <Image src={image_url} alt={text} boxSize="400px" objectFit="cover" />
        <Text>{text}</Text>
        {audio_url && <audio controls src={audio_url} />}
        <HStack spacing={8} width="100%" justifyContent="center">
          <Button onClick={goToPreviousPage} colorScheme="teal" isDisabled={currentIndex === 0}>
            Previous
          </Button>
          <Button onClick={goToNextPage} colorScheme="teal" isDisabled={currentIndex === pages.length - 1}>
            Next
          </Button>
        </HStack>
      </VStack>
    </Center>
  );
};

export default PhotoCarousel;
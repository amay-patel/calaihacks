import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Center, VStack, Image, Text, HStack, Button, Flex, Spacer } from '@chakra-ui/react';
import db from '../firebase/firebase';
import { Page } from '../state/story';
import HTMLFlipBook from 'react-pageflip';
import { useAtom } from 'jotai';
import { getStory } from "../firebase/firebase";
import { storyAtom } from '../state/story';
import { Box } from '@chakra-ui/react';

// const PhotoCarousel = () => {
//   const { id } = useParams<{ id: string }>();
//   const [pages, setPages] = useState<Page[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     if (id) {
//       const fetchStory = async () => {
//         try {
//           const docRef = doc(db, 'stories', id);
//           const storyDoc = await getDoc(docRef);
//           if (storyDoc.exists()) {
//             setPages(storyDoc.data().pages as Page[]);
//           } else {
//             console.log('No such document!');
//           }
//         } catch (error) {
//           console.error('Error fetching document:', error);
//         }
//       };
//       fetchStory();
//     }
//   }, [id]);

//   const goToNextPage = () => {
//     if (currentIndex < pages.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     } else {
//       console.log('No more pages!');
//     }
//   };

//   const goToPreviousPage = () => {
//     if (currentIndex > 0) {
//       setCurrentIndex(currentIndex - 1);
//     } else {
//       console.log('No previous pages!');
//     }
//   };

//   const currentPage = pages[currentIndex];

//   if (!currentPage) {
//     return <Center>Loading...</Center>;
//   }

//   const { image_url, text, audio_url } = currentPage;

//   return (
//     <Center height="100vh" flexDirection="column">
//       <VStack spacing={4}>
//         <Image src={image_url} alt={text} boxSize="400px" objectFit="cover" />
//         <Text>{text}</Text>
//         {audio_url && <audio controls src={audio_url} />}
//         <HStack spacing={8} width="100%" justifyContent="center">
//           <Button onClick={goToPreviousPage} colorScheme="teal" isDisabled={currentIndex === 0}>
//             Previous
//           </Button>
//           <Button onClick={goToNextPage} colorScheme="teal" isDisabled={currentIndex === pages.length - 1}>
//             Next
//           </Button>
//         </HStack>
//       </VStack>
//     </Center>
//   );
// };

const StoryPage = React.forwardRef<HTMLDivElement, Page & {pageNumber: number}>(({ image_url, text, audio_url, pageNumber }, ref) => { 
  return (
    <div ref={ref}>
      <Flex p={4}>
        {pageNumber % 2 === 0 ? <>
          <div>{pageNumber}</div><Spacer />
        </> : <><Spacer />
        <div>{pageNumber}</div></>}
      </Flex>
      <Center height="100%" p={8} backgroundColor="#FEEBC8">
        <VStack spacing={4}>
          <Image src={image_url} alt="" boxSize="400px" objectFit="cover" />
          <Text>{text}</Text>
          {audio_url && <audio controls src={audio_url} />}
        </VStack>
      </Center>
    </div>
  );
});

const PhotoCarousel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pages, setPages] = useAtom(storyAtom);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (id) {
      const fetchStory = async (storyId: string) => {
        const storyRef = await getStory(storyId);
        if (storyRef) {
          setPages(storyRef);
        } else {
          console.log('No such document!');
        }
      };

      fetchStory(id);
    }
  }, [id, setPages]);
  
  const currentPage = pages.pages[currentIndex];
  if (!currentPage) {
    return <Center>Loading...</Center>;
  }

  return (
    <Box borderWidth={3} backgroundColor="#FEEBC8">
      {/* @ts-ignore */}
      <HTMLFlipBook width={550}
            height={733}
            size="stretch"
            minWidth={315}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1533}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}>
        {pages.pages.map((page, index) => (
              <StoryPage key={index} pageNumber={index + 1} {...page} />
        ))}
      </HTMLFlipBook> 
    </Box>
  );
}


export default PhotoCarousel;
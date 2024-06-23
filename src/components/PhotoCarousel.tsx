import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
    Center,
    VStack,
    Image,
    Text,
    HStack,
    Button,
    Flex,
    Spacer,
} from "@chakra-ui/react";
import db from "../firebase/firebase";
import { Page } from "../state/story";
import HTMLFlipBook from "react-pageflip";
import { useAtom } from "jotai";
import { getStory } from "../firebase/firebase";
import { storyAtom } from "../state/story";
import { Box } from "@chakra-ui/react";
import "./../photocarousel.css";
import { formatDatetime } from "../utils/formatDatetime";

const StoryPage = React.forwardRef<
    HTMLDivElement,
    Page & { pageNumber: number }
>(({ image_url, text, audio_url, pageNumber }, ref) => {
    return (
        <div ref={ref} className="page">
            <Flex p={4}>
                {pageNumber % 2 === 0 ? (
                    <>
                      <Spacer />
                        <div>{pageNumber}</div>
                    </>
                ) : (
                    <>
                        <div>{pageNumber}</div>
                        <Spacer />
                    </>
                )}
            </Flex>
            <Center height="80%" p={32}>
                <VStack spacing={6}>
                    <Image
                        src={image_url}
                        alt=""
                        boxSize="400px"
                        objectFit="cover"
                    />
                    <Text>{text}</Text>
                    {audio_url && <audio controls src={audio_url} />}
                </VStack>
            </Center>
        </div>
    );
});

const PhotoCarousel: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [story, setStory] = useAtom(storyAtom);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (id) {
            const fetchStory = async (storyId: string) => {
                const storyRef = await getStory(storyId);
                if (storyRef) {
                    setStory(storyRef);
                } else {
                    console.log("No such document!");
                }
            };

            fetchStory(id);
        }
    }, [id, setStory]);

    const currentPage = story.pages[currentIndex];
    if (!currentPage) {
        return <Center>Loading...</Center>;
    }

    return (
        <Box height="100vh" overflow="hidden" backgroundColor="#FEEBC8">
            <Text color="gray" textAlign="center">
                {story.datetime && formatDatetime(story.datetime)}
            </Text>
            <Box borderWidth={3}>
                {/* @ts-ignore */}
                <HTMLFlipBook
                    width={570}
                    height={window.innerHeight}
                    size="stretch"
                    // minWidth={315}
                    // maxWidth={1000}
                    // minHeight={400}
                    // maxHeight={window.innerHeight}
                    maxShadowOpacity={0.5}
                    showCover={false}
                    mobileScrollSupport={true}
                >
                    {story.pages.map((page, index) => (
                        <StoryPage
                            key={index}
                            pageNumber={index + 1}
                            {...page}
                        />
                    ))}
                </HTMLFlipBook>
            </Box>
        </Box>
    );
};

export default PhotoCarousel;

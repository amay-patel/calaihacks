import React, { useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Textarea,
    Image,
    Progress,
} from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { imageFiles } from "./ImageNames";

const getRandomImage = () => {
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    return `/defaultImgs/${imageFiles[randomIndex]}`;
};

// Jotai atoms for state management
const storyTextAtom = atom("");
const storyImageAtom = atom(getRandomImage());
const audioProgressAtom = atom(0);

const StoryCreator = () => {
    const [storyText, setStoryText] = useAtom(storyTextAtom);
    const [storyImage, setStoryImage] = useAtom(storyImageAtom);
    const [audioProgress, setAudioProgress] = useAtom(audioProgressAtom);
    const [isGenerating, setIsGenerating] = useState(false);

    const generateStory = async () => {
        setIsGenerating(true);
        // Simulating API call to OpenAI for story generation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setStoryText("Once upon a time, in a magical kingdom...");
        setIsGenerating(false);
    };

    const generateImage = async () => {
        setIsGenerating(true);
        // For now, we'll just select another random image
        // In a real scenario, this would be an API call to generate a new image
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStoryImage(getRandomImage());
        setIsGenerating(false);
    };

    const playAudio = () => {
        // Simulating audio playback
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setAudioProgress(progress);
            if (progress >= 100) clearInterval(interval);
        }, 500);
    };

    return (
        <Box p={5} maxWidth="800px" margin="auto">
            <VStack spacing={6} align="stretch">
                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                    Interactive Storybook Creator
                </Text>

                <HStack>
                    <Box flex={1} borderWidth={1} borderRadius="md" p={4}>
                        <Image
                            src={storyImage}
                            alt="Story illustration"
                            objectFit="cover"
                            boxSize="300px"
                        />
                    </Box>
                    <VStack flex={1} align="stretch" spacing={4}>
                        <Textarea
                            value={storyText}
                            onChange={(e) => setStoryText(e.target.value)}
                            placeholder="Your story will appear here..."
                            minHeight="200px"
                        />
                        <Button
                            onClick={generateStory}
                            isLoading={isGenerating}
                        >
                            Generate Story
                        </Button>
                        <Button
                            onClick={generateImage}
                            isLoading={isGenerating}
                        >
                            Generate Image
                        </Button>
                    </VStack>
                </HStack>

                <Box>
                    <Text mb={2}>Audio Narration</Text>
                    <Progress value={audioProgress} mb={2} />
                    <Button
                        onClick={playAudio}
                        isDisabled={audioProgress > 0 && audioProgress < 100}
                    >
                        {audioProgress > 0 && audioProgress < 100
                            ? "Playing..."
                            : "Play Narration"}
                    </Button>
                </Box>
            </VStack>
        </Box>
    );
};

export default StoryCreator;

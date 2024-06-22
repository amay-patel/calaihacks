import React, { useState } from "react";
import {
    ChakraProvider,
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

// Jotai atoms for state management
const storyTextAtom = atom("");
const storyImageAtom = atom("");
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
        // Simulating API call to OpenAI for image generation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setStoryImage("/api/placeholder/400/300");
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
        <ChakraProvider>
            <Box p={5} maxWidth="800px" margin="auto">
                <VStack spacing={6} align="stretch">
                    <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                        Interactive Storybook Creator
                    </Text>

                    <HStack>
                        <Box flex={1} borderWidth={1} borderRadius="md" p={4}>
                            <Image
                                src={storyImage || "/api/placeholder/400/300"}
                                alt="Story illustration"
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
                            isDisabled={
                                audioProgress > 0 && audioProgress < 100
                            }
                        >
                            {audioProgress > 0 && audioProgress < 100
                                ? "Playing..."
                                : "Play Narration"}
                        </Button>
                    </Box>
                </VStack>
            </Box>
        </ChakraProvider>
    );
};

export default StoryCreator;

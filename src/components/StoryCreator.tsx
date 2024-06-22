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
    useToast,
} from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { imageFiles } from "./ImageNames";
import { apiKeysAtom } from "../state/apiKeys"; // Make sure this path is correct

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
    const [apiKeys] = useAtom(apiKeysAtom);
    const [isGenerating, setIsGenerating] = useState(false);
    const toast = useToast();

    const generateStory = async () => {
        setIsGenerating(true);
        // Simulating API call to OpenAI for story generation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setStoryText("Once upon a time, in a magical kingdom...");
        setIsGenerating(false);
    };

    const generateImage = async () => {
        if (!apiKeys.OPENAI_API_KEY) {
            toast({
                title: "API Key Missing",
                description: "Please set your OpenAI API key in the settings.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch(
                "https://api.openai.com/v1/images/generations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKeys.OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        prompt: storyText || "A magical storybook scene",
                        n: 1,
                        size: "512x512",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to generate image");
            }

            const data = await response.json();
            setStoryImage(data.data[0].url);
        } catch (error) {
            console.error("Error generating image:", error);
            toast({
                title: "Image Generation Failed",
                description:
                    "There was an error generating the image. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsGenerating(false);
        }
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

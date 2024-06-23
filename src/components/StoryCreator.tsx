import React, { useEffect, useState } from "react";
import {
    Box,
    VStack,
    Text,
    Button,
    Image,
    useToast,
    IconButton,
    Tooltip,
    MenuList,
    MenuItem,
    MenuButton,
    Menu,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { apiKeysAtom } from "../state/apiKeys"; // Make sure this path is correct
import {
    addPageToStory,
    createStory,
    getAllStoryIds,
    getStory,
} from "../firebase/firebase";
import {
    getRandomImage,
    storyImageAtom,
    storyTextAtom,
} from "../state/currentStory";
import { allStoriesAtom, storyAtom } from "../state/story";
import { fetchAccessToken } from "@humeai/voice";
import { FaBookOpen, FaPlus } from "react-icons/fa";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import ImageWithShimmer from "./ImageWithShimmer";

// Jotai atoms for state management

const StoryCreatorInner = () => {
    const [storyText, setStoryText] = useAtom(storyTextAtom);
    const [storyImage, setStoryImage] = useAtom(storyImageAtom);
    const [allStories, setAllStories] = useAtom(allStoriesAtom);
    const [apiKeys] = useAtom(apiKeysAtom);
    const [isGenerating, setIsGenerating] = useState(false);
    const [story, setStory] = useAtom(storyAtom);
    const { connect, disconnect, status, lastVoiceMessage } = useVoice();
    const [messages, setMessages] = useState<string[]>([]);

    useEffect(() => {
        console.log(status);
    }, [status]);

    useEffect(() => {
        // updates the messages from the bot
        if (
            lastVoiceMessage != null &&
            lastVoiceMessage?.message.content !== "" &&
            lastVoiceMessage?.message.content !== null
        ) {
            // const newArray = [...messages, lastVoiceMessage.message.content]
            setMessages([lastVoiceMessage.message.content]);
            // const message = newArray.join(' ').trim()
            setStoryText(lastVoiceMessage.message.content);
            generateImage(lastVoiceMessage.message.content);
        }
    }, [lastVoiceMessage?.message.content]);

  const toast = useToast();

  const captureAndUploadImage = async (image_url: string) => {
    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: image_url }), // body data type must match "Content-Type" header
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json(); // parses JSON response into native JavaScript objects
  };

    useEffect(() => {
        const fetchStory = async (storyId: string) => {
            const firebaseStory = await getStory(storyId);
            if (firebaseStory) {
                setStory(firebaseStory);
                if (firebaseStory.pages.length > 0) {
                    setStoryImage(firebaseStory.pages.at(-1)?.image_url!);
                }
            }
        };

        const fetchAllStories = async () => {
            const stories = await getAllStoryIds();
            setAllStories(stories);
        };

        // Check if there's an existing story ID in localStorage
        const existingStoryId = localStorage.getItem("currentStoryId");
        fetchAllStories();
        if (!existingStoryId) {
            initializeNewStory();
        } else {
            fetchStory(existingStoryId);
            toast({
                position: "bottom-right",
                title: "Existing Story Loaded",
                description: `Story ID: ${existingStoryId}`,
                status: "info",
                duration: 5000,
                isClosable: true,
            });
        }
    }, []);

    const initializeNewStory = async () => {
        try {
            const newStoryId = await createStory([]);
            localStorage.setItem("currentStoryId", newStoryId);
            setStoryImage(getRandomImage());
            toast({
                position: "bottom-right",
                title: "New Story Created",
                description: `Story ID: ${newStoryId}`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Error creating new story:", error);
            toast({
                position: "bottom-right",
                title: "Error",
                description: "Failed to create a new story.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const startStopStory = async () => {
        setIsGenerating(true);
        if (status.value === "connected") {
            disconnect();
            return;
        }
        void connect()
            .then(() => {})
            .catch((e) => {
                console.error(e);
            });
        setIsGenerating(false);
    };

    const generateImage = async (message: string) => {
        if (!apiKeys.OPENAI_API_KEY) {
            toast({
                position: "bottom-right",
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
            prompt: message,
            n: 1,
            size: "512x512",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      const tmpImageUrl = data.data[0].url;
      // convert the url here

      setStoryImage(tmpImageUrl);
      const { url } = await captureAndUploadImage(tmpImageUrl);
      await savePage(message, url);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        position: "bottom-right",
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

    const savePage = async (message: string, image_url: string) => {
        const currentStoryId = localStorage.getItem("currentStoryId");
        if (!currentStoryId) {
            toast({
                position: "bottom-right",
                title: "Error",
                description: "No active story. Please refresh the page.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        try {
            await addPageToStory(currentStoryId, {
                text: message,
                image_url: image_url,
                audio_url: "", // We're not handling audio yet, so leaving this empty
            });
            setStory({
                ...story,
                pages: [
                    ...story.pages,
                    {
                        text: message,
                        image_url: image_url,
                        audio_url: "", // We're not handling audio yet, so leaving this empty
                    },
                ],
            });
            toast({
                position: "bottom-right",
                title: "Page Saved",
                description: "The current page has been added to the story.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            // Clear the current page content
            // setStoryText("");
            // setStoryImage("/images/placeholder.jpg");
        } catch (error) {
            console.error("Error saving page:", error);
            toast({
                position: "bottom-right",
                title: "Error",
                description: "Failed to save the page. Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const checkoutExistingStory = async (storyId: string) => {
        try {
            const newStory = await getStory(storyId);
            localStorage.setItem("currentStoryId", storyId);
            if (newStory) {
                setStory(newStory);
                if (newStory.pages.length > 0) {
                    setStoryImage(newStory.pages.at(-1)?.image_url!);
                } else {
                    setStoryImage(getRandomImage());
                }
            }
        } catch (error) {
            console.error("Error creating new story:", error);
            toast({
                position: "bottom-right",
                title: "Error",
                description: "Failed to create a new story.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Box p={5} maxWidth="800px" margin="auto">
            <VStack spacing={6} align="stretch" marginTop="2rem">
                <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                    Interactive Storybook Creator
                </Text>

                <Box h="md">
                    {isGenerating && story.pages.length === 0 ? (
                        <ImageWithShimmer src="/defaultImgs/placeholder.png" />
                    ) : (
                        <Image
                            src={storyImage}
                            alt="Story illustration"
                            objectFit="cover"
                            boxSize="300px"
                            width="100%"
                            height="100%"
                            borderRadius="0.5rem"
                        />
                    )}
                </Box>

                <Button
                    onClick={startStopStory}
                    isLoading={isGenerating}
                    color={status.value === "connected" ? "red" : "green"}
                >
                    {status.value === "connected" ? "End Story" : "Start Story"}
                </Button>

                {story.pages.length > 0 ? (
                    story.pages.map((e, index) => (
                        <Box key={index}>{e.text}</Box>
                    ))
                ) : (
                    <Box textAlign="center">Generate a Story Book!</Box>
                )}
            </VStack>
            <Box position="fixed" top={4} right={4} zIndex={10}>
                <Menu>
                    <Tooltip label="Browse Stories" aria-label="Edit tooltip">
                        <MenuButton
                            as={IconButton}
                            icon={<FaBookOpen />}
                            aria-label="Browse"
                            mr={2}
                        />
                    </Tooltip>
                    <MenuList maxHeight="600px" overflowY="auto">
                        {allStories.map((e, index) => (
                            <MenuItem
                                key={index}
                                onClick={() => checkoutExistingStory(e)}
                            >
                                {e}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
                <Tooltip label="Create New Story" aria-label="Edit tooltip">
                    <IconButton
                        icon={<FaPlus />}
                        aria-label="Add"
                        onClick={initializeNewStory}
                    />
                </Tooltip>
            </Box>
        </Box>
    );
};

const StoryCreator = () => {
    const [accessToken, setAccessToken] = useState("");
    const [apiKeys] = useAtom(apiKeysAtom);

    const fetchToken = async () => {
        // make sure to set these environment variables
        const apiKey = apiKeys.HUME_API_KEY;
        const secretKey = apiKeys.HUME_SECRET_KEY;
        const token = await fetchAccessToken({ apiKey, secretKey });
        setAccessToken(token);
    };

    useEffect(() => {
        if (apiKeys.HUME_API_KEY && apiKeys.HUME_SECRET_KEY) {
            fetchToken();
        }
    }, [apiKeys]);

    return (
        <VoiceProvider
            auth={{ type: "accessToken", value: accessToken }}
            configId="d615bf07-8989-4514-8401-13e47804c6ad"
        >
            <StoryCreatorInner />
        </VoiceProvider>
    );
};

export default StoryCreator;

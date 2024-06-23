import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  useToast,
  Image as ChakraImage,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { apiKeysAtom } from "../state/apiKeys"; // Make sure this path is correct
import db, {
  addPageToStory,
  createStory,
  getStory,
} from "../firebase/firebase";
import { storyImageAtom, storyTextAtom } from "../state/currentStory";
import { storyAtom } from "../state/story";
import { fetchAccessToken } from "@humeai/voice";
import { VoiceProvider, useVoice } from "@humeai/voice-react";

// Jotai atoms for state management

const StoryCreatorInner = () => {
  const [storyText, setStoryText] = useAtom(storyTextAtom);
  const [storyImage, setStoryImage] = useAtom(storyImageAtom);
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
      // setMessages([lastVoiceMessage.message.content])
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
      }
    };

    // Check if there's an existing story ID in localStorage
    const existingStoryId = localStorage.getItem("currentStoryId");
    if (!existingStoryId) {
      initializeNewStory();
    } else {
      fetchStory(existingStoryId);
      toast({
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
      toast({
        title: "New Story Created",
        description: `Story ID: ${newStoryId}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error creating new story:", error);
      toast({
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
      console.log(tmpImageUrl);
      const { url } = await captureAndUploadImage(tmpImageUrl);
      await savePage(message, url);
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

  const savePage = async (message: string, image_url: string) => {
    const currentStoryId = localStorage.getItem("currentStoryId");
    if (!currentStoryId) {
      toast({
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
        title: "Error",
        description: "Failed to save the page. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={5} maxWidth="800px" margin="auto">
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          Interactive Storybook Creator
        </Text>

        <HStack>
          <Box flex={1}>
            <ChakraImage
              src={storyImage}
              alt="Story illustration"
              objectFit="cover"
              boxSize="300px"
              width="100%"
              height="100%"
              borderRadius="0.5rem"
            />
          </Box>
          <VStack flex={1} align="stretch" spacing={4}>
            <Textarea
              backgroundColor={"white"}
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="Your story will appear here..."
              minHeight="200px"
            />
            <Button onClick={startStopStory} isLoading={isGenerating}>
              {status.value === "connected" ? "Stop" : "Start chat"}
            </Button>
          </VStack>
        </HStack>
        {story.pages.map((e, index) => (
          <Box key={index}>{e.text}</Box>
        ))}
      </VStack>
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

import React, { useEffect, useRef, useState } from "react";
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
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Flex,
  Input,
  ModalFooter,
  useClipboard,
  useDisclosure,
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
import { LiveAudioVisualizer } from "react-audio-visualize";
import {
  fetchDallE,
  fetchOpenAiWithDiffusionPrompt,
} from "../utils/fetchOpenAi";
import { formatDatetime } from "../utils/formatDatetime";
import { IoMdMic, IoMdMicOff } from "react-icons/io";
import { topProsodyAtom } from "../state/prosody";
import { getFaceByEmotion } from "../utils/emotionFaces";

// Jotai atoms for state management

const StoryCreatorInner = () => {
  const [storyText, setStoryText] = useAtom(storyTextAtom);
  const [storyImage, setStoryImage] = useAtom(storyImageAtom);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [allStories, setAllStories] = useAtom(allStoriesAtom);
  const [apiKeys] = useAtom(apiKeysAtom);
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useAtom(storyAtom);
  const [globalMuted, setGlobalMuted] = useState(false);
  const { hasCopied, onCopy } = useClipboard(
    `localhost:3001/view/${localStorage.getItem("currentStoryId")}`
  );
  const {
    connect,
    disconnect,
    status,
    lastVoiceMessage,
    mute,
    unmute,
    isMuted,
  } = useVoice();
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [messages, setMessages] = useState<string[]>([]);
  const [dateState, setDate] = useState<any | null>(null);
  const [topProsody, setTopProsody] = useAtom<string>(topProsodyAtom);

  const prosody = lastVoiceMessage?.models.prosody?.scores ?? {};
  useEffect(() => {
    const myObj = prosody;
    if (Object.keys(myObj).length > 0) {
      const newTopProsody = Object.keys(myObj).reduce((a, b) =>
        typeof myObj[a] === "number" &&
        typeof myObj[b] === "number" &&
        myObj[a] > myObj[b]
          ? a
          : b
      );
      setTopProsody(newTopProsody);
    }
  }, [lastVoiceMessage]);

  useEffect(() => {
    console.log(status);
  }, [status]);

  useEffect(() => {
    console.log(isMuted);
  }, [isMuted]);

  useEffect(() => {
    // updates the messages from the bot
    if (
      lastVoiceMessage != null &&
      lastVoiceMessage?.message.content !== "" &&
      lastVoiceMessage?.message.content !== null &&
      lastVoiceMessage.models.prosody != null
    ) {
      // there is a valid message -->
      console.log(lastVoiceMessage.models.prosody);
      const [highestKey, _] = Object.entries(
        lastVoiceMessage.models.prosody?.scores
      ).reduce((highest, current) => {
        // If the current value is higher, return the current entry
        // Otherwise, keep the highest we've seen so far
        return current[1] > highest[1] ? current : highest;
      });
      // mute the user
      mute();
      // grab most recent message
      const recentMessage = lastVoiceMessage.message.content;
      console.log(recentMessage);
      // end the story
      if (
        recentMessage.toLowerCase().endsWith("the end") ||
        recentMessage.toLowerCase().endsWith("the end.")
      ) {
        const newArray = [...messages, recentMessage];
        const message = newArray.join(" ").trim();
        console.log(message);
        setStoryText(message);
        generateImage(message);
        setMessages([]);
        startStopStory(); // maybe change to either stop or start and no toggling
        if (!globalMuted) {
          unmute();
        }
      } else if (recentMessage.endsWith("?")) {
        // send to picture generation
        const newArray = messages;
        const message = newArray.join(" ").trim();
        console.log(message);
        setStoryText(message);
        generateImage(message);
        setMessages([]);
        if (!globalMuted) {
          unmute();
        }
      } else {
        // append and don't send
        const newArray = [...messages, recentMessage];
        setMessages(newArray);
      }
    }
  }, [lastVoiceMessage?.message.content]);

  useEffect(() => {
    async function setupMediaRecorder() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
      } catch (err) {
        console.error("Error accessing media devices.", err);
      }
    }

    setupMediaRecorder();

    // Cleanup function
    return () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };
  }, []);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.AudioContext)();
    if (mediaRecorder && mediaRecorder.state === "inactive") {
      mediaRecorder.start();
    }
  }, [mediaRecorder]);

  const toast = useToast();

  const handleCopy = () => {
    onCopy();
    toast({
      position: "bottom-right",
      title: "Link copied!",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

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
        console.log(firebaseStory);
        if (firebaseStory.datetime) {
          setDate(formatDatetime(firebaseStory.datetime));
        }
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
      const datetime = new Date().toISOString();
      const newStoryId = await createStory({
        pages: [],
        datetime: datetime,
      });
      localStorage.setItem("currentStoryId", newStoryId);
      setStory({ pages: [], datetime: datetime });
      setDate(formatDatetime(story.datetime));
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
    console.log("firing");
    setIsGenerating(true);
    if (status.value === "connected") {
      disconnect();
      // pop modal
      onOpen();
      setIsGenerating(false);
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
      const completionsResponse = await fetchOpenAiWithDiffusionPrompt(
        apiKeys.OPENAI_API_KEY,
        message
      );
      const completionsResponseData = await completionsResponse.json();
      const promptRaw: string =
        completionsResponseData.choices[0].message.content;
      const extraAttribute = topProsody ? `, ${topProsody.toLowerCase()}` : "";
      let promptSplit = promptRaw.split(".");
      promptSplit[0] = `${promptSplit[0]}, cute, hand-drawn illustration${extraAttribute}`;
      const promptCommas = promptSplit.join(", ").split("\n").join("");
      const prompt = promptCommas[0].toLowerCase() + promptCommas.slice(1);

      const response = await fetchDallE(apiKeys.OPENAI_API_KEY, `${prompt}`);

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
      <VStack spacing={6} align="stretch" marginTop="2.5rem">
        <Text fontSize="2xl" fontWeight="bold" textAlign="center">
          StoryBook AI
        </Text>
        <Text color="gray" textAlign="center">
          {dateState}
        </Text>

        <Box h="md">
          {isGenerating && story.pages.length === 0 ? (
            <ImageWithShimmer src="/defaultImgs/placeholder.png" />
          ) : (
            <Image
              src={storyImage}
              alt="Story illustration"
              objectFit="contain"
              boxSize="300px"
              width="100%"
              height="100%"
              borderRadius="0.5rem"
            />
          )}
        </Box>

        {status.value !== "connected" ? (
          <Button
            onClick={startStopStory}
            color="green"
            maxW={800}
            margin="auto"
          >
            Start Story
          </Button>
        ) : mediaRecorder ? (
          <Flex gap={2} maxW={800} margin="auto">
            <Button
              flex={0.7}
              style={{ pointerEvents: "none" }}
              backgroundColor="#CBC3E3"
              w={138}
              // p={3}
            >
              {!isMuted && (
                <LiveAudioVisualizer
                  mediaRecorder={mediaRecorder}
                  barColor="white"
                  width={120}
                  height={25}
                />
              )}
            </Button>
            <Button flex={0.3} onClick={startStopStory} colorScheme="red">
              End Story
            </Button>
          </Flex>
        ) : (
          <Button
            onClick={startStopStory}
            backgroundColor="#FF7F7F"
            color="white"
          >
            End Story
          </Button>
        )}

        {story.pages.length > 0 ? (
          <Box textAlign="center">{story.pages.at(-1)!.text}</Box>
        ) : (
          <Box textAlign="center">Generate a Story Book!</Box>
        )}
      </VStack>
      <Box position="fixed" top={4} right={4} zIndex={10}>
        <Tooltip
          label={globalMuted ? "unmute" : "mute"}
          aria-label="mute or unmute"
        >
          {globalMuted ? (
            <IconButton
              icon={<IoMdMicOff />}
              aria-label="muted"
              onClick={() => {
                unmute();
                setGlobalMuted(false);
              }}
            ></IconButton>
          ) : (
            <IconButton
              icon={<IoMdMic />}
              aria-label="unmuted"
              onClick={() => {
                mute();
                setGlobalMuted(true);
              }}
            ></IconButton>
          )}
        </Tooltip>

        <Menu>
          <Tooltip label="Browse Stories" aria-label="Edit tooltip">
            <MenuButton
              as={IconButton}
              icon={<FaBookOpen />}
              aria-label="Browse"
              mr={2}
              ml={2}
            />
          </Tooltip>
          <MenuList maxHeight="600px" overflowY="auto">
            {allStories.map((e, index) => (
              <MenuItem key={index} onClick={() => checkoutExistingStory(e)}>
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
      <Box position="fixed" top="16px" left="16px" zIndex="sticky">
        <Text marginBottom="1.5rem">Top Emotion</Text>
        <Box marginLeft="1rem">{getFaceByEmotion(topProsody)}</Box>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share this link</ModalHeader>
          <ModalCloseButton />
          <ModalBody marginBottom={7}>
            <Flex>
              <Input
                value={`localhost:3001/view/${localStorage.getItem(
                  "currentStoryId"
                )}`}
                isReadOnly
              />
              <Button onClick={handleCopy} ml={2}>
                {hasCopied ? "Copied!" : "Copy"}
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
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
    console.log("heres the token", token);
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
      configId={process.env.REACT_APP_CONFIG_ID}
    >
      <StoryCreatorInner />
    </VoiceProvider>
  );
};

export default StoryCreator;

import React, { useState, useEffect, useRef, MutableRefObject } from "react";
import { useParams } from "react-router-dom";
import { apiKeysAtom } from "../state/apiKeys"; // Make sure this path is correct
import { fetchAccessToken } from "@humeai/voice";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { FaMusic } from "react-icons/fa";
import {
    Center,
    VStack,
    Image,
    Text,
    Flex,
    Spacer,
    IconButton,
} from "@chakra-ui/react";
import db from "../firebase/firebase";
import { Page } from "../state/story";
import HTMLFlipBook from "react-pageflip";
import { useAtom } from "jotai";
import { getStory } from "../firebase/firebase";
import { storyAtom } from "../state/story";
import { Box } from "@chakra-ui/react";
import "./../photocarousel.css";
import { useVoiceClient } from "@humeai/voice-react";
import { formatDatetime } from "../utils/formatDatetime";

const StoryPage = React.forwardRef<
    HTMLDivElement,
    Page & {
        pageNumber: number;
        handler: (inputValue: string) => void;
        readyState: string;
        isPlaying: number;
        setIsPlaying: React.Dispatch<React.SetStateAction<number>>;
    }
>(
    (
        {
            image_url,
            text,
            audio_url,
            pageNumber,
            handler,
            readyState,
            isPlaying,
            setIsPlaying,
        },
        ref
    ) => {
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
                        {readyState === "open" && (
                            <IconButton
                                aria-label="play button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setIsPlaying(pageNumber);
                                    handler(text);
                                }}
                                isLoading={isPlaying === pageNumber}
                                isDisabled={
                                    isPlaying === -1 || isPlaying === pageNumber
                                        ? false
                                        : true
                                }
                                // color={"green"}
                                backgroundColor={"#f1ebfd"}
                                icon={<FaMusic />}
                            ></IconButton>
                        )}
                        <Text>{text}</Text>
                        {audio_url && <audio controls src={audio_url} />}
                    </VStack>
                </Center>
            </div>
        );
    }
);

const PhotoCarousel: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [story, setStory] = useAtom(storyAtom);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [accessToken, setAccessToken] = useState("");
    const [apiKeys] = useAtom(apiKeysAtom);

    const audioQueue: Blob[] = [];
    let isPlaying = false;
    const [playing, setPlaying] = useState(-1);
    let currentAudio: HTMLAudioElement | null = null;
    const mimeType: string = "audio/mpeg";

    // helper functions START
    function convertBase64ToBlob(base64String: string, contentType = "") {
        const byteCharacters = atob(base64String);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);

            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    }
    function playAudio(): void {
        // IF there is nothing in the audioQueue OR audio is currently playing then do nothing

        if (!audioQueue.length || isPlaying) return;

        // update isPlaying state

        isPlaying = true;

        // pull next audio output from the queue

        const audioBlob = audioQueue.shift();

        // IF audioBlob is unexpectedly undefined then do nothing

        if (!audioBlob) return;

        // converts Blob to AudioElement for playback

        const audioUrl = URL.createObjectURL(audioBlob);

        currentAudio = new Audio(audioUrl);

        // play audio

        currentAudio.play();

        // callback for when audio finishes playing

        currentAudio.onended = () => {
            // update isPlaying state

            isPlaying = false;

            // attempt to pull next audio output from queue

            if (audioQueue.length) {
                playAudio();
            } else {
                setPlaying(-1);
            }
        };
    }
    // helper functions END

    const { readyState, connect, disconnect, sendAssistantInput } =
        useVoiceClient({
            onAudioMessage: (message) => {
                switch (message.type) {
                    case "audio_output":
                        const audioOutput = message.data;
                        const blob = convertBase64ToBlob(audioOutput, mimeType);
                        audioQueue.push(blob);
                        if (audioQueue.length === 1) playAudio();
                        break;
                }
            },
        });

    useEffect(() => {
        if (accessToken && accessToken !== "") {
            connect({
                hostname: "api.hume.ai",
                auth: { type: "accessToken", value: accessToken },
                debug: false,
                reconnectAttempts: 2,
                configId: process.env.REACT_APP_CONFIG_ID,
            });
        }
    }, [accessToken]);

    const handleAudioOutput = (inputValue: string) => {
        sendAssistantInput(inputValue);
    };

    useEffect(() => {
        const fetchToken = async () => {
            // make sure to set these environment variables
            const apiKey = apiKeys.HUME_API_KEY;
            const secretKey = apiKeys.HUME_SECRET_KEY;
            const token = await fetchAccessToken({ apiKey, secretKey });
            setAccessToken(token);
        };

        if (apiKeys.HUME_API_KEY && apiKeys.HUME_SECRET_KEY) {
            fetchToken();
        }
    }, [apiKeys]);

    useEffect(() => {
        console.log(playing);
    }, [playing]);

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
            <Box borderWidth={2} borderColor="#C19A6B">
                {/* @ts-ignore */}
                <HTMLFlipBook
                    width={730}
                    height={window.innerHeight}
                    size="stretch"
                    // minWidth={315}
                    // maxWidth={1000}
                    // minHeight={400}
                    // maxHeight={window.innerHeight}
                    maxShadowOpacity={0.5}
                    showCover={false}
                    mobileScrollSupport={true}
                    disableFlipByClick
                >
                    {story.pages.map((page, index) => (
                        <StoryPage
                            key={index}
                            pageNumber={index + 1}
                            handler={handleAudioOutput}
                            readyState={readyState}
                            isPlaying={playing}
                            setIsPlaying={setPlaying}
                            {...page}
                        />
                    ))}
                </HTMLFlipBook>
            </Box>
        </Box>
    );
};

export default PhotoCarousel;

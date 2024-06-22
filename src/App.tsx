import React from "react";
import "./App.css";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import StoryCreator from "./components/StoryCreator";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { Global } from "@emotion/react";

// Custom font face definition
const Fonts = () => (
    <Global
        styles={`
      @font-face {
        font-family: 'Funkids';
        src: url('/fonts/Funkids.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    `}
    />
);

// Extend the Chakra theme to use Funkids as the default font
const theme = extendTheme({
    fonts: {
        body: "Funkids, sans-serif",
        heading: "Funkids, sans-serif",
    },
});

function App() {
    return (
        <ChakraProvider theme={theme}>
            <Fonts />
            <ApiKeyModal />
            <StoryCreator />
        </ChakraProvider>
    );
}

export default App;

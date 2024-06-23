import React from "react";
import "./App.css";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import StoryCreator from "./components/StoryCreator";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { Global } from "@emotion/react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PhotoCarousel from "./components/PhotoCarousel";
import FloatingBubblesBackground from "./components/FloatingBubblesBackground";

// Custom font face definition
const Fonts = () => (
    <Global
        styles={`
      @font-face {
        font-family: 'hartby';
        src: url('/fonts/hartby.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
      }
    `}
    />
);

// Extend the Chakra theme to use Hartby as the default font
const theme = extendTheme({
    fonts: {
        body: "hartby, sans-serif",
        heading: "hartby, sans-serif",
    },
    styles: {
        global: {
            // Apply letter spacing to all text
            body: {
                letterSpacing: "0.05em",
            },
            // Additional spacing for headings
            "h1, h2, h3, h4, h5, h6": {
                letterSpacing: "0.08em",
            },
        },
    },
    components: {
        // Adjust button text spacing
        Button: {
            baseStyle: {
                letterSpacing: "0.06em",
            },
        },
        // Adjust textarea text spacing
        Textarea: {
            baseStyle: {
                letterSpacing: "0.04em",
            },
        },
    },
});

function App() {
    return (
        <ChakraProvider theme={theme}>
            <Fonts />
            <FloatingBubblesBackground>
                <ApiKeyModal />
                <Router>
                    <Routes>
                        <Route path="/" element={<StoryCreator />} />
                        <Route path="/view/:id" element={<PhotoCarousel />} />
                    </Routes>
                </Router>
            </FloatingBubblesBackground>
        </ChakraProvider>
    );
}

export default App;

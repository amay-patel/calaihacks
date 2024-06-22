import React from "react";
import "./App.css";
import { ChakraProvider } from "@chakra-ui/react";
import StoryCreator from "./components/StoryCreator";

function App() {
    return (
        <ChakraProvider>
            <StoryCreator />
        </ChakraProvider>
    );
}

export default App;

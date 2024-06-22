import React from "react";
import "./App.css";
import { ChakraProvider } from "@chakra-ui/react";
import StoryCreator from "./components/StoryCreator";
import { ApiKeyModal } from "./components/ApiKeyModal";

function App() {
  return (
    <ChakraProvider>
      <ApiKeyModal />
      <StoryCreator />
    </ChakraProvider>
  );
}

export default App;

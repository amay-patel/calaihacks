import React, { useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";
import { atom, useAtom } from "jotai";
import { apiKeysAtom } from "../state/apiKeys";

const isModalOpenAtom = atom<boolean>(false);

export const ApiKeyModal: React.FC = () => {
  const [apiKeys, setApiKeys] = useAtom(apiKeysAtom);
  const [isModalOpen, setIsModalOpen] = useAtom(isModalOpenAtom);

  useEffect(() => {
    const storedKeys = localStorage.getItem("apiKeys");
    if (storedKeys) {
      setApiKeys(JSON.parse(storedKeys));
    } else {
      setIsModalOpen(true);
    }
  }, [setApiKeys, setIsModalOpen]);

  const handleSave = () => {
    localStorage.setItem("apiKeys", JSON.stringify(apiKeys));
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiKeys((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enter API Keys</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>OpenAI API Key</FormLabel>
              <Input
                name="OPENAI_API_KEY"
                value={apiKeys.OPENAI_API_KEY}
                onChange={handleInputChange}
                type="password"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Hume API Key</FormLabel>
              <Input
                name="HUME_API_KEY"
                value={apiKeys.HUME_API_KEY}
                onChange={handleInputChange}
                type="password"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Hume Secret Key</FormLabel>
              <Input
                name="HUME_SECRET_KEY"
                value={apiKeys.HUME_SECRET_KEY}
                onChange={handleInputChange}
                type="password"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSave}>
            Save
          </Button>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

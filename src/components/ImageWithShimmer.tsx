import React from "react";
import {
    Box,
    Image,
    keyframes,
    usePrefersReducedMotion,
} from "@chakra-ui/react";

const shimmer = keyframes`
  0% { transform: translateX(-100%) skewX(-30deg); }
  50% { transform: translateX(100%) skewX(-30deg); }
  100% { transform: translateX(-100%) skewX(-30deg); }
`;

const ShimmerEffect = () => {
    const prefersReducedMotion = usePrefersReducedMotion();

    const animation = prefersReducedMotion
        ? undefined
        : `${shimmer} 3.75s ease-in-out infinite`;

    return (
        <Box
            height="150%"
            width="150%"
            position="absolute"
            overflow="hidden"
            bg="gray.100"
            top="-25%" // Offset to ensure full coverage
            left="-25%" // Offset to ensure full coverage
            transform="skewX(-30deg)" // Apply the slant
            zIndex={1}
            opacity={0.9}
        >
            <Box
                height="100%"
                width="50%"
                background="linear-gradient(to right, transparent 0%, rgba(255,255,255,0.8) 85%, transparent 100%)"
                position="absolute"
                animation={animation}
            />
        </Box>
    );
};

const ImageWithShimmer = ({ src }: any) => {
    return (
        <Box
            position="relative"
            width="100%"
            paddingBottom="56.25%"
            overflow="hidden"
        >
            <ShimmerEffect />
            <Image
                src={src}
                alt="loading"
                position="absolute"
                top="0"
                left="0"
                width="100%"
                height="100%"
                objectFit="cover"
                opacity={1}
                borderRadius="0.5rem"
                transition="opacity 0.3s ease-in-out"
            />
        </Box>
    );
};

export default ImageWithShimmer;

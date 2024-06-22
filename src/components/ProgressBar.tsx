import React from "react";
import { Progress } from "@chakra-ui/react";

const ProgressBar = ({ current, total }: any) => (
    <Progress value={(current / total) * 100} mt={4} />
);

export default ProgressBar;

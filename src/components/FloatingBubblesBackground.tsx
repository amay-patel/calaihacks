import React from "react";
import "./FloatingBubblesBackground.css";

const FloatingBubblesBackground = ({ children }: any) => {
    const colors = ["#E6E6FA", "#F0E6FF", "#E6F3FF", "#E6FFFA"];

    const generateBubbles = () => {
        return Array.from({ length: 50 }, (_, i) => (
            <circle
                key={i}
                cx={`${Math.random() * 100}%`}
                cy={`${Math.random() * 100}%`}
                r={`${Math.random() * 3 + 1}%`}
                fill={colors[Math.floor(Math.random() * colors.length)]}
                opacity="0.7"
            />
        ));
    };

    return (
        <div className="background-container">
            <div className="background">
                <svg
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect width="100%" height="100%" fill="#F8F8FF" />
                    {generateBubbles()}
                </svg>
            </div>
            <div className="content">{children}</div>
        </div>
    );
};

export default FloatingBubblesBackground;

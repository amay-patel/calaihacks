export const fetchDallE = async (openAiKey: string, message: string) =>
  await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      prompt: message,
      n: 1,
      size: "512x512",
    }),
  });

export const fetchOpenAiWithDiffusionPrompt = async (
  openAiKey: string,
  message: string
) =>
  await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            `You are a preprocessing assistant for visual descriptions. Write a five-word description of the text.
            Then, list five single-word attributes that capture the text's visual/stylistic characteristics.
            Separate by commas. Lowercase. No newlines. No numbers.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

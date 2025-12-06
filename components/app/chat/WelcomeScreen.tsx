import { Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (message: { text: string }) => void;
}

const suggestions = [
  "Show me oak tables",
  "Leather sofas under £1000",
  "What chairs do you have?",
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-4">
      <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
        <Sparkles className="h-8 w-8 text-amber-500" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
        How can I help you today?
      </h3>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
        I can help you find furniture by style, material, color, or price. Just
        ask!
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick({ text: suggestion })}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

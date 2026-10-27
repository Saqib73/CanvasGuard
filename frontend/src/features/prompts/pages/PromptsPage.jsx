import { useState } from "react";
import { useStore } from "../../../app/store/store";
import { Button } from "../../../components/ui/Button";

const starterPrompts = [
  {
    id: "pr1",
    title: "Monthly theme: Night City",
    description: "Cyberpunk vibes. Share your illustration.",
    tag: "#NightCity",
  },
  {
    id: "pr2",
    title: "Draw this in your style",
    description: "Pick a reference and reinterpret it.",
    tag: "#DTIYS",
  },
];

export default function PromptsPage() {
  const { createPost } = useStore();
  const [promptId, setPromptId] = useState("pr1");
  const active = starterPrompts.find((p) => p.id === promptId);

  function submitEntry() {
    createPost("me", `${active.title} ${active.tag}\nMy entry!`, {
      license: ["no_ai"],
      watermarked: true,
    });
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 backdrop-blur bg-base-100/80 border-b border-base-300 p-4 font-semibold text-lg">
        Prompts & Challenges
      </div>
      <div className="p-6 space-y-4 max-w-xl">
        <select
          value={promptId}
          onChange={(e) => setPromptId(e.target.value)}
          className="w-full bg-base-200 border border-base-300 rounded-xl px-4 py-3 text-base-content focus:outline-none"
        >
          {starterPrompts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <div className="text-neutral-400 text-sm leading-relaxed">
          {active?.description}
        </div>
        <Button onClick={submitEntry} className="rounded-full">
          Join challenge
        </Button>
      </div>
    </div>
  );
}

export const Prompts = PromptsPage;

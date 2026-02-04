import { useState, useEffect } from "react";
import { riddles } from "../data/riddles";

export default function RiddleBox() {
    const [index, setIndex] = useState(0);
    const [input, setInput] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem("riddleIndex");
        if (saved) setIndex(Number(saved));
    }, []);

    const checkAnswer = () => {
        const correct = riddles[index].answer.toLowerCase();

        if (input.toLowerCase().trim() === correct) {
            setMessage("CORRECT... NEXT CHALLENGE UNLOCKED");

            const next = index + 1;
            setIndex(next);
            localStorage.setItem("riddleIndex", next);
            setInput("");
        } else {
            setMessage("WRONG. YOU ARE NOT AS CLEVER AS YOU THINK.");
        }
    };

    if (index >= riddles.length) {
        return (
            <div>
                <h2 className="text-xl">CONGRATULATIONS</h2>
                <p>You solved everything. More soon.</p>
            </div>
        );
    }

    return (
        <div>
            <p className="mb-4">{riddles[index].question}</p>

            <input
                className="bg-black border border-green-500 p-2 w-full"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && checkAnswer()}
            />

            <button
                onClick={checkAnswer}
                className="mt-3 border border-green-500 px-4 py-1"
            >
                SUBMIT
            </button>

            <p className="mt-3 text-sm">{message}</p>
        </div>
    );
}

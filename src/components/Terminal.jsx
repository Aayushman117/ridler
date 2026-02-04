import { useEffect, useRef, useState } from "react";
import { riddles } from "../data/riddles";

export default function TerminalRiddle() {
    const [displayText, setDisplayText] = useState("");
    const [userInput, setUserInput] = useState("");
    const [stage, setStage] = useState("intro");
    const [index, setIndex] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [lines, setLines] = useState([]);


    const startedRef = useRef(false);
    const cancelRef = useRef(false);

    const addLine = (text) => {
        setLines(prev => [...prev, text]);
    };




    // ───────── TYPEWRITER (SAFE) ─────────
    const typeText = async (text) => {
        cancelRef.current = false;

        let built = "";
        for (let i = 0; i < text.length; i++) {
            if (cancelRef.current) return;

            await new Promise((r) => setTimeout(r, 35));
            built += text[i];
            setDisplayText(built);
        }

        // After finished typing → push to history
        addLine("> " + built);
        setDisplayText("");
    };


    // ───────── INTRO ONCE ONLY ─────────
    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const run = async () => {
            await typeText("HELLO DETECTIVE. PRESS ENTER TO BEGIN.");
            setStage("ready");
        };

        run();

        return () => {
            cancelRef.current = true;
        };
    }, []);

    // ───────── START RIDDLE ─────────
    const startRiddle = async () => {
        console.log("riddle start")
        setStage("typing");
        await typeText(riddles[index].question);
        setStage("answer");
    };

    // ───────── KEYBOARD ─────────
    useEffect(() => {
        const handleKey = (e) => {
            if (stage === "ready" && e.key === "Enter") {
                startRiddle();
                return;
            }

            if (stage === "answer") {
                console.log("1")
                if (e.key === "Enter") {
                    console.log("2")
                    e.preventDefault();
                    checkAnswer();
                } else if (e.key === "Backspace") {
                    setUserInput((p) => p.slice(0, -1));
                } else if (e.key?.length === 1) {
                    setUserInput((p) => p + e.key);
                }
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [stage, userInput, index]);

    // ───────── CHECK ANSWER ─────────
    const checkAnswer = async () => {
        const correct = riddles[index].answer.toLowerCase().trim();
        console.log("ANSER :::: ", correct)
        console.log("v :::: ", userInput)

        // Show what user typed in history
        addLine("> " + userInput);

        if (userInput.toLowerCase().trim() === correct) {

            await typeText("CORRECT... NEXT CHALLENGE UNLOCKED.");

            const next = index + 1;

            if (next < riddles.length) {
                setIndex(next);
                setUserInput("");

                // Start next riddle on NEXT LINE
                await typeText(riddles[next].question);

                setStage("answer");
            } else {
                await typeText("YOU HAVE SOLVED EVERYTHING. MORE SOON.");
                setStage("done");
            }

        } else {
            // 🔥 YOUR REQUESTED MESSAGE
            await typeText("NOT CLEVER BRO. TRY ONE LAST TIME.");
            setUserInput("");
            setWrongCount(prev => prev+1)
            setStage("answer");   // stay in answer mode, no question repeat
        }
    };


    // ───────── UI ─────────
    return (
        <div className="
  p-6 text-green-400 font-mono
  min-h-screen bg-black
  flex flex-col items-start justify-start
">

            {/* HISTORY */}
            <div className="whitespace-pre-wrap">
                {lines.map((l, i) => (
                    <div key={i}>{l}</div>
                ))}
            </div>

            {/* CURRENT TYPING LINE */}
            {displayText && (
                <div>{"> " + displayText}</div>
            )}

            {/* USER INPUT LINE */}

            {(stage === "answer" && wrongCount < 3) && (
                <div className="mt-1">
                    {"> " + userInput}
                    <span className="animate-pulse">▮</span>
                </div>
            )}

        </div>
    );
}

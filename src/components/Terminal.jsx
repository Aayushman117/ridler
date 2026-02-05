import { useEffect, useRef, useState } from "react";
import { riddles } from "../data/riddles";

const shutdownScript = [
    "systemctl stop sshd",
    "systemctl status sshd",
    "● sshd.service - OpenSSH Daemon",
    "Loaded: loaded (/lib/systemd/system/sshd.service; enabled; vendor preset: enabled)",
    "Active: inactive (dead)",
    "Docs: man:sshd(8)",
    "man:sshd_config(5)",
    "Main PID: 1228 (code=exited, status=0/SUCCESS)",
    "rm /var/log/sshd.log",
    "echo -n > ~/.bash_history",
    "exit"
];

export default function TerminalRiddle() {
    const [displayText, setDisplayText] = useState("");
    const [userInput, setUserInput] = useState("");
    const [stage, setStage] = useState("intro");
    const [index, setIndex] = useState(0);
    const [wrongCount] = useState(0);

    const [lines, setLines] = useState([]);
    const [failCount, setFailCount] = useState(0);
    const [blackout, setBlackout] = useState(false);
    const [exitMode, setExitMode] = useState(false);

    const startedRef = useRef(false);
    const cancelRef = useRef(false);

    const addLine = (text) => {
        setLines(prev => [...prev, text]);
    };

    /* ───────── NORMAL TYPER ───────── */
    const typeText = async (text) => {
        cancelRef.current = false;

        let built = "";
        for (let i = 0; i < text.length; i++) {
            if (cancelRef.current) return;

            await new Promise(r => setTimeout(r, 35));
            built += text[i];
            setDisplayText(built);
        }

        addLine("> " + built);
        setDisplayText("");
    };

    /* ───────── EXIT TYPER ───────── */
    const typeExitLine = async (text) => {
        let built = "";

        for (let i = 0; i < text.length; i++) {
            await new Promise(r => setTimeout(r, 6));
            built += text[i];
            setDisplayText(built);
        }

        addLine({ text: built, system: true });
        setDisplayText("");
    };

    /* ───────── INTRO ───────── */
    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const run = async () => {
            await typeText("HELLO DETECTIVE. PRESS ENTER TO BEGIN.");
            setStage("ready");
        };

        run();
        return () => { cancelRef.current = true; };
    }, []);

    const startRiddle = async () => {
        setStage("typing");
        await typeText(riddles[index].question);
        setStage("answer");
    };

    /* ───────── KEYBOARD ───────── */
    useEffect(() => {
        const handleKey = (e) => {
            if (stage === "ready" && e.key === "Enter") {
                startRiddle();
                return;
            }

            if (stage === "answer") {
                if (e.key === "Enter") {
                    e.preventDefault();
                    checkAnswer();
                } else if (e.key === "Backspace") {
                    setUserInput(p => p.slice(0, -1));
                } else if (e.key.length === 1) {
                    setUserInput(p => p + e.key);
                }
            }
        };

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);

    }, [stage, userInput, index]);

    /* ───────── EXIT SEQUENCE ───────── */
    const runBlackoutSequence = async () => {
        setLines([]);
        setDisplayText("");

        for (let line of shutdownScript) {
            await typeExitLine(line);
            await new Promise(r => setTimeout(r, 70));
        }

        await new Promise(r => setTimeout(r, 3000));
        setBlackout(true);
    };

    /* ───────── CHECK ANSWER ───────── */
    const checkAnswer = async () => {
        const correct = riddles[index].answer.toLowerCase().trim();

        addLine("> " + userInput);

        if (userInput.toLowerCase().trim() === correct) {

            await typeText("CORRECT... NEXT CHALLENGE UNLOCKED.");

            const next = index + 1;
            if (next < riddles.length) {
                setIndex(next);
                setUserInput("");
                await typeText(riddles[next].question);
                setStage("answer");
            } else {
                await typeText("YOU HAVE SOLVED EVERYTHING. MORE SOON.");
                setStage("done");
            }

        } else {
            const newFail = failCount + 1;
            setFailCount(newFail);

            if (newFail >= 5) {
                setExitMode(true);
                await runBlackoutSequence();
                return;
            }

            await typeText("NOT CLEVER BRO. TRY ONE LAST TIME.");
            setUserInput("");
            setStage("answer");
        }
    };

    if (blackout) {
        return <div className="bg-black min-h-screen w-full"></div>;
    }

    /* ───────── UI ───────── */

    if (exitMode) {
        return (
            <div className="term-green" style={{ minHeight: "100vh", paddingTop: "40px" }}>
                <div className="whitespace-pre-wrap">
                    {lines.map((l, i) => {
                        if (typeof l === "object" && l.system) {
                            return (
                                <div key={i} style={{ marginLeft: "60px" }}>
                                    {l.text.toLowerCase()}
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="term-green" style={{ minHeight: "100vh", paddingTop: "40px" }}>

            <div className="whitespace-pre-wrap">
                {lines.map((l, i) => {
                    if (typeof l === "object" && l.system) {
                        return (
                            <div key={i} style={{ marginLeft: "60px" }}>
                                {l.text.toLowerCase()}
                            </div>
                        );
                    }

                    return <div key={i}>{l}</div>;
                })}
            </div>

            {displayText && (
                <div>
                    {"> " + displayText}
                    <span className="cursor-block">█</span>
                </div>
            )}

            {(stage === "answer" && wrongCount < 3) && (
                <div className="mt-1">
                    {"> " + userInput}
                    <span className="cursor-block">█</span>
                </div>
            )}

        </div>
    );
}

import { riddles } from "../data/riddles";

export default function Progress({ index }) {
    const percent = Math.floor((index / riddles.length) * 100);

    return (
        <div className="mt-4 text-xs">
            PROGRESS: {percent}%
        </div>
    );
}

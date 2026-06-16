export default function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-8">
            <h1 className="text-4xl font-bold">
                Secure Prompt Generator
            </h1>

            <button className="px-8 py-4 bg-bleu-600 text-white rounded-xl">
                Code Generation
            </button>

            <button className="px-8 py-4 bg-green-600 text-white rounded-xl">
                Code Verification
            </button>
        </div>
    );
}
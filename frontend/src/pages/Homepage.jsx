import { useNavigate } from "react-router-dom";

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center gap-10">
      <h1 className="text-5xl text-white font-bold">Secure Prompt Generator</h1>

      <div className="flex gap-8">
        <button
          onClick={() => navigate("/dashboard/verification")}
          className="px-10 py-6 bg-blue-600 hover:bg-blue-800 text-white text-xl rounded-2xl transition"
        >
          Code Verification
        </button>

        <button
          onClick={() => navigate("/dashboard/generation")}
          className="px-10 py-6 bg-green-600 hover:bg-green-800 text-white text-xl rounded-2xl transition"
        >
          Code Generation
        </button>
      </div>
    </div>
  );
}

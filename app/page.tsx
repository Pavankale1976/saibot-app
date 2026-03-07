import ChatWidget from "@/components/ChatWidget";
import PanchangWidget from "@/components/PanchangWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-orange-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-orange-900 font-bold text-lg">
            ॐ
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Shirdi Sai Temple of Atlanta</h1>
            <p className="text-orange-200 text-sm">Sai Sevak · Virtual Assistant</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <p className="text-orange-800 text-sm">
            Ask me about temple hours, events, programs, directions, or anything else.
          </p>
          <p className="text-orange-600 text-xs mt-1">
            700 James Burgess Rd, Suwanee GA 30024 · 678-455-7200
          </p>
        </div>
        <PanchangWidget />
        <ChatWidget />
      </div>
    </main>
  );
}

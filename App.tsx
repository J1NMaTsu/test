
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Deck, Theme, THEME_BG } from './types';
import DeckList from './components/DeckList';
import FlashcardViewer from './components/FlashcardViewer';
import BulkEditor from './components/BulkEditor';
import QRScanner from './components/QRScanner';
import { generateFlashcards } from './services/geminiService';

declare const LZString: any;

const App: React.FC = () => {
  const [decks, setDecks] = useState<Record<string, Deck>>({});
  const [theme, setTheme] = useState<Theme>(Theme.DEFAULT);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('flashcards_v3_react');
    const savedTheme = localStorage.getItem('flashcards_theme') as Theme;
    if (saved) setDecks(JSON.parse(saved));
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('flashcards_v3_react', JSON.stringify(decks));
  }, [decks]);

  const saveTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('flashcards_theme', t);
  };

  const createDeck = (name: string) => {
    const id = Date.now().toString();
    const newDeck: Deck = { id, name, cards: [], createdAt: Date.now() };
    setDecks(prev => ({ ...prev, [id]: newDeck }));
    return id;
  };

  const deleteDeck = (id: string) => {
    if (window.confirm('本当に削除しますか？')) {
      const newDecks = { ...decks };
      delete newDecks[id];
      setDecks(newDecks);
    }
  };

  const updateDeck = (id: string, updatedDeck: Deck) => {
    setDecks(prev => ({ ...prev, [id]: updatedDeck }));
  };

  const handleAIInvite = async () => {
    const topic = prompt("トピックを入力してください (例: 高校生物、TOEIC単語):");
    if (!topic) return;
    setIsGenerating(true);
    try {
      const cards = await generateFlashcards(topic);
      const deckId = createDeck(`AI: ${topic}`);
      const newCards = cards.map((c: any) => ({
        ...c,
        id: Math.random().toString(36).substr(2, 9),
        mastered: false,
        favorite: false
      }));
      setDecks(prev => ({
        ...prev,
        [deckId]: { ...prev[deckId], cards: newCards }
      }));
      alert("AIデッキを作成しました！");
    } catch (e) {
      console.error(e);
      alert("AI生成に失敗しました。");
    } finally {
      setIsGenerating(false);
    }
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setDecks(data);
        alert("インポートが完了しました。");
      } catch (err) {
        alert("インポートエラー");
      }
    };
    reader.readAsText(file);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(decks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flashcards_backup.json';
    a.click();
  };

  const handleQRData = (encodedData: string) => {
    try {
      const decoded = LZString.decompressFromEncodedURIComponent(encodedData);
      if (!decoded) throw new Error("Decode failed");
      const [name, cardsRaw] = decoded.split('::');
      const cards = cardsRaw.split('~').map((row: string) => {
        const [q, a] = row.split('|');
        return {
          id: Math.random().toString(36).substr(2, 9),
          question: q,
          answer: a,
          mastered: false,
          favorite: false
        };
      });
      const id = Date.now().toString();
      setDecks(prev => ({
        ...prev,
        [id]: { id, name: `${name} (QR)`, cards, createdAt: Date.now() }
      }));
      setIsScannerOpen(false);
      alert("QRからインポートしました。");
    } catch (e) {
      alert("QRの読み取りに失敗しました。");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${THEME_BG[theme]} p-4 md:p-8 font-sans`}>
      <div className="max-w-4xl mx-auto bg-slate-50/95 backdrop-blur shadow-2xl rounded-[2.5rem] overflow-hidden min-h-[85vh] flex flex-col">
        {/* Header */}
        <header className={`${THEME_BG[theme]} p-8 text-white text-center relative`}>
          <div className="flex justify-center gap-3 mb-6">
            {Object.values(Theme).map(t => (
              <button
                key={t}
                onClick={() => saveTheme(t)}
                className={`w-8 h-8 rounded-full border-2 border-white transition-transform active:scale-90 ${THEME_BG[t]} ${theme === t ? 'ring-2 ring-white ring-offset-2 scale-110' : ''}`}
              />
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 drop-shadow-md">
            🃏 FLASHCARDS Pro
          </h1>
          <p className="text-white/80 font-medium text-sm animate-pulse">
            Smart. Minimal. Powerful.
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
             <button
              onClick={() => {
                const name = prompt("デッキ名を入力:");
                if (name) createDeck(name);
              }}
              className="p-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-2"
            >
              ➕ 新規デッキ
            </button>
            <button
              onClick={handleAIInvite}
              disabled={isGenerating}
              className="p-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              ✨ {isGenerating ? '生成中...' : 'AIで自動作成'}
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="p-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition active:scale-95 flex items-center justify-center gap-2"
            >
              📷 QRを読み取る
            </button>
            <div className="flex gap-2">
              <button
                onClick={exportJSON}
                className="flex-1 p-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition active:scale-95"
              >
                📤 保存
              </button>
              <label className="flex-1 p-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition active:scale-95 cursor-pointer text-center">
                📥 復元
                <input type="file" className="hidden" accept=".json" onChange={importJSON} />
              </label>
            </div>
          </div>

          <DeckList 
            decks={decks} 
            onOpenDeck={setActiveDeckId} 
            onDeleteDeck={deleteDeck}
            onUpdateDeck={updateDeck}
          />
        </main>

        <footer className="p-8 text-center text-slate-400 text-xs border-t border-slate-100">
          <p>© 2025 FLASHCARDS Pro | Designed in Japan</p>
        </footer>
      </div>

      {/* Modals */}
      {activeDeckId && (
        <FlashcardViewer 
          deck={activeDeckId === 'FAVORITE' ? {
            id: 'FAVORITE',
            name: '🌟 お気に入り',
            cards: Object.values(decks).flatMap(d => d.cards).filter(c => c.favorite),
            createdAt: 0
          } : decks[activeDeckId]}
          onClose={() => setActiveDeckId(null)}
          onUpdateCard={(card) => {
            // Find parent deck and update
            const deckId = card._originDeckId || activeDeckId;
            if (deckId === 'FAVORITE') return; // Should not happen with originId
            const targetDeck = decks[deckId];
            if (targetDeck) {
              const updatedCards = targetDeck.cards.map(c => c.id === card.id ? card : c);
              updateDeck(deckId, { ...targetDeck, cards: updatedCards });
            }
          }}
          onOpenBulkEdit={() => setIsBulkEditOpen(true)}
        />
      )}

      {isBulkEditOpen && activeDeckId && activeDeckId !== 'FAVORITE' && (
        <BulkEditor 
          deck={decks[activeDeckId]}
          onClose={() => setIsBulkEditOpen(false)}
          onSave={(updatedCards) => {
            updateDeck(activeDeckId, { ...decks[activeDeckId], cards: updatedCards });
            setIsBulkEditOpen(false);
          }}
        />
      )}

      {isScannerOpen && (
        <QRScanner 
          onScan={handleQRData} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;

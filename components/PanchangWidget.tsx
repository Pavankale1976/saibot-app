"use client";

import { useEffect, useState } from "react";

interface PanchangData {
  date: string;
  inauspicious: {
    rahuKalam: { label: string; start: string; end: string };
    yamaGandam: { label: string; start: string; end: string };
    gulikaKalam: { label: string; start: string; end: string };
  };
  auspicious: {
    amritKaal: { label: string; start: string; end: string };
  };
  moonSign: string | null;
  currentHora: string | null;
}

export default function PanchangWidget() {
  const [data, setData] = useState<PanchangData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/panchang")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(true);
        else setData(d);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  return (
    <div className="bg-white rounded-2xl shadow border border-orange-100 p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-orange-600 text-lg">🪔</span>
        <h2 className="text-sm font-semibold text-orange-800 uppercase tracking-wide">
          Today&apos;s Panchang
        </h2>
      </div>

      {!data ? (
        <div className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-orange-50 rounded w-full" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-orange-500 mb-3">{data.date}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Inauspicious */}
            <div>
              <p className="text-xs font-semibold text-red-700 mb-1.5 uppercase tracking-wide">
                Inauspicious Timings
              </p>
              <div className="space-y-1.5">
                {Object.values(data.inauspicious).map((item) => (
                  <div key={item.label} className="flex justify-between text-xs bg-red-50 rounded-lg px-3 py-1.5">
                    <span className="text-red-800 font-medium">{item.label}</span>
                    <span className="text-red-600">{item.start} – {item.end}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Auspicious + Moon/Hora */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1.5 uppercase tracking-wide">
                  Auspicious Timing
                </p>
                <div className="space-y-1.5">
                  {Object.values(data.auspicious).map((item) => (
                    <div key={item.label} className="flex justify-between text-xs bg-green-50 rounded-lg px-3 py-1.5">
                      <span className="text-green-800 font-medium">{item.label}</span>
                      <span className="text-green-600">{item.start} – {item.end}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {data.moonSign && (
                  <div className="flex-1 bg-blue-50 rounded-lg px-3 py-1.5 text-xs text-center">
                    <p className="text-blue-400 text-[10px] uppercase font-semibold">Moon Sign</p>
                    <p className="text-blue-800 font-medium">{data.moonSign}</p>
                  </div>
                )}
                {data.currentHora && (
                  <div className="flex-1 bg-amber-50 rounded-lg px-3 py-1.5 text-xs text-center">
                    <p className="text-amber-400 text-[10px] uppercase font-semibold">Current Hora</p>
                    <p className="text-amber-800 font-medium">{data.currentHora}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

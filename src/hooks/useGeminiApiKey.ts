"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "urban_air_gemini_api_key";

export function useGeminiApiKey() {
  const [apiKey, setApiKey] = useState<string>("");
  const [tempKey, setTempKey] = useState<string>("");
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY);
      if (savedKey) {
        setApiKey(savedKey);
        setTempKey(savedKey);
      }
    } catch {
      // LocalStorage access may fail in private mode
    }
  }, []);

  const saveKey = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmed = tempKey.trim();
      setApiKey(trimmed);
      try {
        if (trimmed) {
          localStorage.setItem(STORAGE_KEY, trimmed);
          setNotice("Gemini API key saved to browser local storage!");
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setNotice("Custom API key removed. Using default assistant fallback.");
        }
      } catch {
        setNotice("Unable to persist key to local storage.");
      }
      setTimeout(() => setNotice(null), 3000);
    },
    [tempKey]
  );

  const clearKey = useCallback(() => {
    setApiKey("");
    setTempKey("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setNotice("Custom API key cleared.");
    setTimeout(() => setNotice(null), 3000);
  }, []);

  return {
    apiKey,
    tempKey,
    setTempKey,
    showPanel,
    setShowPanel,
    showKeyText,
    setShowKeyText,
    notice,
    saveKey,
    clearKey,
  };
}

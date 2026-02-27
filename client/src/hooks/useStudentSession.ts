import { useState, useCallback } from "react";

function generateKey(): string {
  return Math.random().toString(36).substring(2, 15);
}

const VOTED_KEY = "votedPolls"; // sessionStorage key for voted poll IDs
const CHOSEN_KEY = "chosenOptions"; // sessionStorage key for chosen option per poll

export function useStudentSession() {
  const [studentKey] = useState<string>(() => {
    const existing = sessionStorage.getItem("studentKey");
    if (existing) return existing;
    const key = generateKey();
    sessionStorage.setItem("studentKey", key);
    return key;
  });

  const [name, setNameState] = useState<string>(() => {
    return sessionStorage.getItem("studentName") || "";
  });

  const setName = (newName: string) => {
    sessionStorage.setItem("studentName", newName);
    setNameState(newName);
  };

  /** Mark a poll as voted (persists in sessionStorage) */
  const markVoted = useCallback((pollId: string) => {
    const existing: string[] = JSON.parse(
      sessionStorage.getItem(VOTED_KEY) || "[]"
    );
    if (!existing.includes(pollId)) {
      existing.push(pollId);
      sessionStorage.setItem(VOTED_KEY, JSON.stringify(existing));
    }
  }, []);

  /** Remove a poll from the voted list (revert optimistic mark) */
  const unmarkVoted = useCallback((pollId: string) => {
    const existing: string[] = JSON.parse(
      sessionStorage.getItem(VOTED_KEY) || "[]"
    );
    const filtered = existing.filter((id) => id !== pollId);
    sessionStorage.setItem(VOTED_KEY, JSON.stringify(filtered));
  }, []);

  /** Check if the student already voted on a specific poll */
  const hasVoted = useCallback((pollId: string): boolean => {
    const existing: string[] = JSON.parse(
      sessionStorage.getItem(VOTED_KEY) || "[]"
    );
    return existing.includes(pollId);
  }, []);

  /** Save the option the student chose for a given poll */
  const saveChosenOption = useCallback((pollId: string, optionId: string) => {
    const map: Record<string, string> = JSON.parse(
      sessionStorage.getItem(CHOSEN_KEY) || "{}"
    );
    map[pollId] = optionId;
    sessionStorage.setItem(CHOSEN_KEY, JSON.stringify(map));
  }, []);

  /** Get the option the student chose for a given poll */
  const getChosenOption = useCallback((pollId: string): string | null => {
    const map: Record<string, string> = JSON.parse(
      sessionStorage.getItem(CHOSEN_KEY) || "{}"
    );
    return map[pollId] ?? null;
  }, []);

  return { studentKey, name, setName, markVoted, unmarkVoted, hasVoted, saveChosenOption, getChosenOption };
}

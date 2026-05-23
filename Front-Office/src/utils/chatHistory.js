export function sortChatHistory(history) {
  if (!Array.isArray(history)) return [];
  return [...history].sort((a, b) => {
    const ta = new Date(a?.time || 0).getTime() || 0;
    const tb = new Date(b?.time || 0).getTime() || 0;
    if (ta !== tb) return ta - tb;
    return String(a?.id || '').localeCompare(String(b?.id || ''));
  });
}

export function mergeChatHistory(local, incomingHistory, message) {
  const map = new Map();
  const add = (m) => {
    if (!m || !String(m.text || '').trim()) return;
    const key = m.id || `${m.sender}|${m.time}|${m.text}`;
    map.set(key, m);
  };
  for (const m of local || []) add(m);
  for (const m of incomingHistory || []) add(m);
  if (message) add(message);
  return sortChatHistory([...map.values()]);
}

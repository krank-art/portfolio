export function loadStorage(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : item;
}

export function saveStorage(key, value) {
  localStorage.setItem(key, value);
}

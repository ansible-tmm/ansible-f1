let _questions = [];
let _loaded = false;

export async function loadQuestions() {
  if (_loaded) return _questions;
  try {
    const resp = await fetch("./src/data/questions.json");
    _questions = await resp.json();
  } catch {
    console.warn("Failed to load questions.json, using empty pool");
    _questions = [];
  }
  _loaded = true;
  return _questions;
}

export function getQuestions() {
  return _questions;
}

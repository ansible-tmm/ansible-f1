import { getQuestions } from "../data/questions.js";

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class QuizSystem {
  constructor() {
    this._pool = [];
    this._used = [];
  }

  resetPool() {
    this._pool = shuffle([...getQuestions()]);
    this._used = [];
  }

  nextQuestion() {
    if (this._pool.length === 0) {
      this._pool = shuffle([...getQuestions()]);
      this._used = [];
    }
    const raw = this._pool.pop();
    this._used.push(raw.id);

    // Shuffle answer order so the correct answer isn't always in the same slot
    const indices = [0, 1, 2, 3];
    shuffle(indices);
    const shuffledOptions = indices.map((i) => raw.options[i]);
    const newAnswer = indices.indexOf(raw.answer);

    return {
      ...raw,
      options: shuffledOptions,
      answer: newAnswer,
    };
  }

  isCorrect(question, optionIndex) {
    return optionIndex === question.answer;
  }
}

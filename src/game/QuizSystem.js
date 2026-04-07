import { getQuestions } from "../data/questions.js";

export class QuizSystem {
  constructor() {
    this._pool = [];
  }

  resetPool() {
    this._pool = [...getQuestions()];
  }

  nextQuestion() {
    if (this._pool.length === 0) {
      this._pool = [...getQuestions()];
    }
    const i = Math.floor(Math.random() * this._pool.length);
    const [q] = this._pool.splice(i, 1);
    return q;
  }

  isCorrect(question, optionIndex) {
    return optionIndex === question.answer;
  }
}

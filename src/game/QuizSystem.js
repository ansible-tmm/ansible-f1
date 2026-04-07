import { QUESTIONS } from "../data/questions.js";

export class QuizSystem {
  constructor() {
    this._pool = [...QUESTIONS];
  }

  /**
   * @returns {typeof QUESTIONS[0]}
   */
  nextQuestion() {
    if (this._pool.length === 0) {
      this._pool = [...QUESTIONS];
    }
    const i = Math.floor(Math.random() * this._pool.length);
    const [q] = this._pool.splice(i, 1);
    return q;
  }

  resetPool() {
    this._pool = [...QUESTIONS];
  }

  isCorrect(question, optionIndex) {
    return optionIndex === question.answer;
  }
}

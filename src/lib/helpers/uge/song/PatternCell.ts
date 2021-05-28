export class PatternCell {
  note: number | null;
  instrument: number | null;
  effectcode: number | null;
  effectparam: number | null;

  constructor() {
    this.note = null;
    this.instrument = null;
    this.effectcode = null;
    this.effectparam = null;
  }
}

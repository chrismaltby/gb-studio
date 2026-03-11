export interface MODSample {
  name: string;
  sampleLength: number;
  finetune: number;
  volume: number;
  repeatPoint: number;
  repeatLength: number;
}

export interface MODCell {
  note: number;
  instrument: number;
  effect: {
    code: EffectCode;
    params: number;
  };
}

export type MODPattern = MODCell[][];

export interface MODFile {
  name: string;
  samples: MODSample[];
  songLen: number;
  positions: number[];
  mkMagic: string;
  patterns: MODPattern[];
}

export type EffectCode =
  | 0x0
  | 0x1
  | 0x2
  | 0x3
  | 0x4
  | 0x5
  | 0x6
  | 0x7
  | 0x8
  | 0x9
  | 0xa
  | 0xb
  | 0xc
  | 0xd
  | 0xe
  | 0xf;

import {
  exportToC,
  loadUGESong,
  saveUGESong,
} from "../../../../src/shared/lib/uge/ugeHelper";
import { readFile } from "fs-extra";

test("should convert noise macro from uge 5 files into uge 6 subpattern", async () => {
  const data = await readFile(`${__dirname}/song_template_v5.uge`);
  const song = loadUGESong(data);

  expect(song.version).toBe(6);
  expect(song.noiseInstruments[11].subpatternEnabled).toBe(true);
  expect(song.noiseInstruments[11].subpattern).toEqual(
    SUBPATTERN_FROM_NOISE_MACRO_EXAMPLE,
  );
});

test("should load uge 6 files and return a Song object", async () => {
  const data = await readFile(`${__dirname}/song_template_v6.uge`);
  const song = loadUGESong(data);

  expect(song.version).toBe(6);
  expect(song.dutyInstruments[0].name).toBe("Fade Out 25% Pulse");
});

test("should save a file correctly", async () => {
  const data = await readFile(`${__dirname}/song_template_v6.uge`);
  const song = loadUGESong(data);

  expect(song.version).toBe(6);

  const savedData = saveUGESong(song);

  expect(savedData).toStrictEqual(data);
});

test("should export the song to C", async () => {
  const data = await readFile(`${__dirname}/song_template_v6.uge`);
  const song = loadUGESong(data);

  expect(song.version).toBe(6);

  const savedData = exportToC(song, "song_template");

  expect(savedData).toBe(SONG_V6_TO_C);
});

const SUBPATTERN_FROM_NOISE_MACRO_EXAMPLE = [
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: 63,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: 50,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: 53,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: 34,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: 6,
    note: 36,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: 36,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
  {
    effectCode: null,
    effectParam: null,
    jump: null,
    note: null,
  },
];

const SONG_V6_TO_C = `#pragma bank 255

#include "hUGEDriver.h"
#include <stddef.h>
#include "hUGEDriverRoutines.h"

static const unsigned char order_cnt = 2;
static const unsigned char song_pattern_0[] = {
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
    DN(___, 0, 0x000),
};
static const unsigned char* const order1[] = {song_pattern_0};
static const unsigned char* const order2[] = {song_pattern_0};
static const unsigned char* const order3[] = {song_pattern_0};
static const unsigned char* const order4[] = {song_pattern_0};
static const hUGEDutyInstr_t duty_instruments[] = {
    { 0x00, 0x40, 0xB5, 0, 0x80 },
    { 0x00, 0x80, 0xB5, 0, 0x80 },
    { 0x00, 0x00, 0x09, 0, 0xC0 },
    { 0x00, 0x30, 0xB0, 0, 0xC0 },
    { 0x00, 0x70, 0xB0, 0, 0xC0 },
    { 0x00, 0xB0, 0xB0, 0, 0xC0 },
    { 0x00, 0x00, 0xB0, 0, 0x80 },
    { 0x00, 0x40, 0xB0, 0, 0x80 },
    { 0x00, 0x80, 0xB0, 0, 0x80 },
    { 0x00, 0xC0, 0xB0, 0, 0x80 },
    { 0x1C, 0x80, 0xB2, 0, 0xC0 },
    { 0x19, 0x80, 0xB5, 0, 0x80 },
    { 0x47, 0x00, 0xB7, 0, 0x80 },
    { 0x15, 0x60, 0xB7, 0, 0xC0 },
    { 0x00, 0x80, 0x00, 0, 0x80 },
};
static const hUGEWaveInstr_t wave_instruments[] = {
    { 0x80, 0x20, 0x01, 0, 0xC0 },
    { 0x80, 0x20, 0x02, 0, 0xC0 },
    { 0x80, 0x20, 0x03, 0, 0xC0 },
    { 0x80, 0x20, 0x04, 0, 0xC0 },
    { 0x80, 0x20, 0x05, 0, 0xC0 },
    { 0x80, 0x20, 0x06, 0, 0xC0 },
    { 0x00, 0x20, 0x07, 0, 0x80 },
    { 0x00, 0x20, 0x08, 0, 0x80 },
    { 0x00, 0x20, 0x09, 0, 0x80 },
    { 0x00, 0x20, 0x0A, 0, 0x80 },
    { 0x00, 0x20, 0x0B, 0, 0x80 },
    { 0x00, 0x20, 0x0C, 0, 0x80 },
    { 0x00, 0x20, 0x0D, 0, 0x80 },
    { 0x00, 0x20, 0x0E, 0, 0x80 },
    { 0x00, 0x20, 0x0F, 0, 0x80 },
};
static const hUGENoiseInstr_t noise_instruments[] = {
    { 0x91, 0, 0x70, 0, 0 },
    { 0x91, 0, 0x60, 0, 0 },
    { 0x91, 0, 0x00, 0, 0 },
    { 0x92, 0, 0x00, 0, 0 },
    { 0x94, 0, 0x00, 0, 0 },
    { 0x94, 0, 0x00, 0, 0 },
    { 0xB1, 0, 0x00, 0, 0 },
    { 0xB1, 0, 0x80, 0, 0 },
    { 0xB1, 0, 0x80, 0, 0 },
    { 0x91, 0, 0x80, 0, 0 },
    { 0xB2, 0, 0x40, 0, 0 },
    { 0xB1, 0, 0x56, 0, 0 },
    { 0xB7, 0, 0x00, 0, 0 },
    { 0xB7, 0, 0x80, 0, 0 },
    { 0x00, 0, 0x00, 0, 0 },
};
static const unsigned char waves[] = {
    0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88,
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0xCC, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x33,
    0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0xAA, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55,
    0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x77, 0x77, 0x77, 0x77, 0x77, 0x77, 0x77, 0x77,
    0xFF, 0xFF, 0xCC, 0xCC, 0xFF, 0xFF, 0xCC, 0xCC, 0x00, 0x00, 0x33, 0x33, 0x00, 0x00, 0x33, 0x33,
    0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32, 0x10, 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF,
    0xFF, 0xFF, 0xBA, 0x98, 0xA9, 0x87, 0x32, 0x10, 0x34, 0x56, 0x45, 0x67, 0xBC, 0xDE, 0xCD, 0xEF,
    0xFF, 0xEE, 0xDD, 0xCC, 0xBB, 0xAA, 0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00,
    0xFF, 0xFE, 0xFD, 0xFC, 0xFB, 0xFA, 0xF9, 0xF8, 0xE7, 0xD6, 0xC5, 0xB4, 0xA3, 0x92, 0x81, 0x70,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
};

const void __at(255) __bank_song_template_Data;
const hUGESong_t song_template_Data = {
    6,
    &order_cnt,
    order1, order2, order3, order4,
    duty_instruments, wave_instruments, noise_instruments,
    routines,
    waves
};
`;

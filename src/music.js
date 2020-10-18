var i;
var j;

// Inlined by closure compiled
const rowLen = 12027;
const patternLen = 32;
const mLastRow = 26;
const numChannels = 5;
const lowestNote = 99 - 1;
const mNumWords = rowLen * patternLen * (mLastRow + 1);

var wave = new Uint8Array(44 + mNumWords * 2);
var mMixBuf = new Int32Array(mNumWords);

const OSC1_WAVEFORM = 0;
const OSC1_VOL = 1;
const OSC1_XENV = 2;
const OSC2_WAVEFORM = 3;
const OSC2_DETUNE = 4;
const NOISE_VOL = 5;
const ENV_ATTACK = 15;
const ENV_SUSTAIN = 16;
const ENV_RELEASE = 17;
const LFO_AMT = 6;
const LFO_FREQ = 7;
const LFO_FX_FREQ = 8;
const FX_FILTER = 9;
const FX_FREQ = 10;
const FX_RESONANCE = 11;
const FX_DIST = 12;
const FX_DRIVE = 18;
const FX_DELAY_AMT = 13;
const FX_DELAY_TIME = 14;

var columns = [
  [ 37,,,,,,,,44,,,,,,,,39,,,,,,,,,,,,52 ], // 0
  [ 37,,,,,,,,44,,,,,,,,39,,,,,,,,,,,,,,,,49,,,,,,,,56,,,,,,,,51 ], // 1
  [ 49,52,,,,,,,44,51,,,,,,,39,47,,,,,,54,37,46,,,,,,54 ], // 2
  [ 39,34,,,,,,,46,,,,,,,56,39,47,32 ], // 3
  [ 49,52,44,,63,,,,44,51,,,66,,,,39,47 ], // 4
  [ 57,52,45,,61,,,,44,51,,,66,,,,39,47,,68,44 ], // 5
  [ 37,52,44,,,,,71,44,51,,,,,,,39,47,54,,,,,70,37,46,,,,,,54 ], // 6
  [ 39,34,,53,37,,,,46,,,,,,,56,39,47,32,,,,,,59 ], // 7
  [ 62,46,34,53 ], // 8
  , // [ 51,54,46,,65,,,,46,53,,,68,,,,41,49 ], // 9
  , // [ 59,54,47,,63,,,,46,53,,,68,,,,41,49,,70,46 ], // 10
  , // [ 39,54,46,,,,,73,46,53,,,,,,,41,49,56,,,,,72,39,48,,,,,,56 ], // 11
  , // [ 41,36,,55,39,,,,48,,,,,,,58,41,49,34,,,,,,61 ], // 12
  [ 39,54,46,,,,,,53,,,,,,,,61 ], // 13
  [ 8,,,,,,,,20,,,,,,,,8,,,,,,,,20 ], // 14
  // [ 1,,,,,,,,1,,,,,,,,11,,,,,,,,11,,,,,,,,13,,,,,,,,13,,,,,,,,23,,,,,,,,23 ],
  [1,,,,,,,,1,,,,,,,,11,,,,,,,,11,,,,,,,,],
  // [ 13,,,,,,,,8,,,,,,,,11,,,,,,,,6,,,,,,,,25,,,,,,,,20,,,,,,,,23,,,,,,,,18 ],
  [13,,,,,,,,8,,,,,,,,11,,,,,,,,6,,,,,,,,],
  // [ 3,,,,,,,,5,,,,,,,,8,,,,,,,,11,,,,,,,,15,,,,,,,,17,,,,,,,,20,,,,,,,,23 ],
  [3,,,,,,,,5,,,,,,,,8,,,,,,,,11,,,,,,,,],
  // [ 9,,,,,,,,11,,,,,,,,8,,,,,,,,8,,,,,,,,21,,,,,,,,23,,,,,,,,20,,,,,,,,20 ],
  [9,,,,,,,,11,,,,,,,,8,,,,,,,,8,,,,,,,,],
  [ 10,,,,,,,,22,,,,,,,,10,,,,,,,,22 ],
  [ 33,,,,33,,,,33,,,,33,,,,33,,,,33,,,,33,,,,33 ],
  [ 33 ],
  [ ,,37,,,,37,,,,37,,,,37,,,,37,,,,37,,,,37,,,,37 ],
  [ 3,,3,,3,,,,3,,3,,3,,,,1,,1,,1,,,,1,,1,,1 ],
  [ 11,,11,,11,,,,15,,15,,15,,,,10,,10,,10,,,,10,,10,,10 ],
  [ 3,,3,,3,,,,5,,5,,5,,,,8,,8,,8,,,,3,,3,,3 ],
  [ 5,,5,,5,,,,7,,7,,7,,,,10,,10,,10,,,,10,,10,,13 ],
  [ 3 ],
];

var patterns = [
  [ i=1,++i,++i,++i,,i=1,++i,++i,++i,++i,++i,++i,++i,++i,++i,++i,++i,++i,i=10,
    ++i,++i,++i,++i,i,i,i ],
  [ ,,,,++i,++i,i,++i,++i,i=16,i=19,i=17,++i,i=20 ],
  [ ,,,,,,,,,,,,,,++i,i,i,i,i,i,i,i,++i,,,,i ],
  [ ,,,,,,,,,,,,,,++i,i,i,i,i,i,i,i ],
  [ ,,,,,,,,,,,,,,++i,++i,++i,++i,i=24,++i,++i,++i,i=24,++i,i=24,++i,i=28 ],
];

var instruments = [
  [ 0,128,0,1,1,0,195,2,1,1,59,51,14,4,6,192,0,99,13 ],
  [ 1,128,0,2,1,0,127,2,1,0,14,203,209,4,6,128,61,88,48 ],
  [ 0,255,2,2,0,14,0,0,0,0,64,128,0,4,6,4,0,45,24 ],
  [ 0,128,2,0,0,255,64,7,1,1,197,15,0,1,6,4,0,62,13 ],
  [ 1,128,0,2,1,0,127,2,1,0,14,203,209,4,3,0,31,37,188 ],
];

wave.set(
  [82,73,70,70,100,30,61,1,87,65,
    86,69,102,109,116,32,16,0,0,0,
    1,0,1,0,68,172,0,0,16,177,
    2,0,4,0,16,0,100,97,116,97,
    64,30,61,1]
);

for (j = 0; j < 4; j++)
  columns[9+j]=columns[4+j].map(x=>x+2);

for (j = 0; j < 4; j++)
  columns[15 + j] = [...columns[15 + j], ...columns[15 + j].map(x=>x+12)];

var mOscillators = [
  value => Math.sin(value * 6.283184),
  value => 2 * (value % 1) - 1,
  value => value % 1 * 4 < 2 ? value % 1 * 4 - 1  : 3 - value % 1 * 4
];

instruments.map((instr, index) => {
  var chnBuf = new Int32Array(mNumWords);
  var low = 0, band = 0, filterActive = 0;

  // Patterns
  for (i = 0; i <= mLastRow; ++i) {

    // Pattern rows
    for (var row = 0; row < patternLen; ++row) {
      var rowStartSample = (i * patternLen + row) * rowLen;
      var n;
      for (j = 0; j < 4; ++j) {
        if (patterns[index][i] && (
          n = columns[patterns[index][i] - 1][row + j * patternLen] + lowestNote
        )) {
          for (var j1 = 0, j2 = 0, asf = rowStartSample,
            e, o1t, o2t,
            c1 = 0, c2 = 0,
            attack = instr[ENV_ATTACK] * instr[ENV_ATTACK] * 4,
            sustain = instr[ENV_SUSTAIN] * instr[ENV_SUSTAIN] * 4,
            release = instr[ENV_RELEASE] * instr[ENV_RELEASE] * 4
            ;
            j1 < attack + sustain + release;
            j1++, j2++) {

            if (j2 >= 0) {
              j2 -= rowLen * 4;
              o2t = (o1t = 0.0039595038 * 2 ** ((n - 128) / 12))
                * (1 + 0.0032 * instr[OSC2_DETUNE]);
            }

            chnBuf[asf++] +=
              80
              * (e = j1 < attack ? j1 / attack : j1 >= attack + sustain
                ? 1 - (j1 - attack - sustain) / release : 1)
              * (mOscillators[instr[OSC1_WAVEFORM]](
                  c1 += o1t * e ** instr[OSC1_XENV]) * instr[OSC1_VOL]
                + mOscillators[instr[OSC2_WAVEFORM]](
                  c2 += o2t * e ** instr[OSC1_XENV]) * instr[OSC1_VOL]
                + (2 * Math.random() - 1) * instr[NOISE_VOL])
                | 0;
          }
        }
      }

      for (var j1 = 0; j1 < rowLen; j1++) {
        var k = rowStartSample + j1;
        var rsample = chnBuf[k];
        var f = instr[FX_FREQ] * 0.0039595038;

        if (rsample || filterActive) {
          if (instr[LFO_FX_FREQ])
            f *= mOscillators[instr[OSC1_WAVEFORM]](2 ** (instr[LFO_FREQ] - 9)
              / rowLen * k) * instr[LFO_AMT] / 512 + 0.5;

          f = 1.5 * Math.sin(f);
          low += f * band;
          band += f * ((1 - instr[FX_RESONANCE] / 255)
            * (rsample - band) - low);
          rsample = instr[FX_FILTER] ? band : low;

          if (instr[FX_DIST])
            rsample = ((rsample *= instr[FX_DIST] * .00001) < 1
              ? rsample > -1 ? mOscillators[0](rsample/4) : -1 : 1)
                / (instr[FX_DIST] * .00001);

          rsample *= instr[FX_DRIVE] / 32;
          filterActive = rsample * rsample > 1e-5;
        }

        if (f = chnBuf[k - instr[FX_DELAY_TIME] * rowLen / 2 | 0])
          rsample += f * instr[FX_DELAY_AMT] / 16;

        mMixBuf[k] += chnBuf[k] = rsample | 0;
      }
    }
  }
});

// Append actual wave data
for (i = 0, j = 44; i < mNumWords; i++) {
  columns = mMixBuf[i];
  columns = columns < -32767 ? -32767 : (columns > 32767 ? 32767 : columns);
  wave[j++] = columns & 255;
  wave[j++] = (columns >> 8) & 255;
}

mMixBuf = new Audio();
mMixBuf.src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));

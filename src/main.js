// Music is added in during compilation.

@PLAYER

// F is canvas created on HTML side
F.style.position = "fixed";
F.style.cursor = "none";
F.style.left = F.style.top = 0;
F.width = 1920;
F.height = 1080;

// Rename webgl functions into shorter ones. Chrome 86 was released less than a
// week before the deadline that reordered the webgl2 context API. This broke
// the shortening function and made results between pre-86 and post-86
// different. As a hotfix, I sort the API method/variable names. This leads to
// consistent results at least for now. Webgl2 is still under heavy development,
// so it's possible this will also break eventually. Still it saves so many
// bytes to do this rather than use just full names.
patterns = [];
for(j in G=F.getContext("webgl2"))
  patterns.push(j);
  // G[j[0]+j[6]] = G[j]
  // G[j[0]+j[6]+j[8]] = G[j]
  // G[j.match(/^..|[A-V]/g).join("")]=G[j];

patterns.sort().map(x => G[x[0]+x[6]]=G[x]);

G.getExtension("EXT_color_buffer_float");
G.getExtension("OES_texture_float_linear");

patterns = [];
mOscillators = [];

columns = [
  "@SHADOWS",
  "@MERGE",
  "@RENDER",
  "@BLUR"
];

for (j = 0; j < 4; j++) {
  G.shaderSource(i = G.createShader(35632),
    "#version 300 es\nprecision highp float;precision highp sampler3D;"
      + "@HEADERout vec4 O" + columns[j]);
  G.shaderSource(wave = G.createShader(35633),
    "#version 300 es\nin vec4 p;void main(){gl_Position=p;}");
  G.compileShader(i);
  G.compileShader(wave);
  G.attachShader(columns[j] = G.createProgram(), i);
  G.attachShader(columns[j], wave);
  G.linkProgram(columns[j]);
  patterns.push(wave = G.createFramebuffer());
}

for (j = 0; j < 7; j++) {
  mOscillators.push(wave = G.createTexture());
  i=10239;
  G.bindTexture(instruments = j > 4 ? 3553 : 32879, wave);
  G.texParameteri(instruments, ++i, 9729);
  G.texParameteri(instruments, ++i, 9729);
  G.texParameteri(instruments, ++i, 33071);
  G.texParameteri(instruments, ++i, 33071);
  if (j > 4)
    G.texImage2D(instruments, 0, 34836, 1920, 1080, 0, 6408, 5126, null)
  else
    G.texImage3D(instruments, 0, 33326, 128, 128, 128, 0, 6403, 5126, null);
}

G.bindBuffer(34962, G.createBuffer());
G.bufferData(34962, new Float32Array([1, 1, 1, -3, -3, 1]), 35044);
G.vertexAttribPointer(0, 2, 5126, 0, 0, 0);
G.enableVertexAttribArray(i = 0);

wave = (program, tex, iter, X, fbTex, tex2) => {
  G.useProgram(columns[program]);
  G.bindFramebuffer(36160, fbTex ? patterns[program] : null);
  if (!program)
    G.drawBuffers([36064, 36065]);

  if (tex2) {
    G.activeTexture(33984+1);
    G.bindTexture(tex2 > 4 ? 3553 : 32879, mOscillators[tex2]);
    G.uniform1i(G.getUniformLocation(columns[program], 'C'), 1)
  }

  G.activeTexture(33984);

  for (j = 0; j < iter; j++) {
    if (program < 2)
      G.framebufferTextureLayer(36160, 36064, mOscillators[fbTex], 0, j);
    if (!program)
      G.framebufferTextureLayer(36160, 36065, mOscillators[j % 2], 0, 0);
    if (fbTex > 4)
      G.framebufferTexture2D(36160, 36064, 3553, mOscillators[fbTex], 0);

    G.bindTexture(tex > 4 ? 3553 : 32879, mOscillators[tex || (j+1) % 2]);
    G.uniform2fv(G.getUniformLocation(
      columns[program], "X"), X || [mMixBuf.currentTime, j]);
    G.drawArrays(4, 0, 3);
  }
}

instruments = () => {
  //   p  tex         iter  X       fbTex        tex2
  wave(0, 0,          128,  0,      2                            ); // Shadows
  wave(1, 2,          128,  0,      ++i % 2 + 3, (i - 1) % 2 + 3 ); // Merge
  wave(2, i % 2 + 3,  1,    0,      5                            ); // Render
  wave(3, 5,          1,    [0, 2], 6                            ); // Blur x
  wave(3, 6,          1,    [2, 0], 0,           5               ); // Blur y

  requestAnimationFrame(instruments);
};

instruments();
mMixBuf.play();

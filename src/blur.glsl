#version 300 es
precision highp float;

uniform vec2 X;
out vec4 O;
uniform sampler2D A;
uniform sampler2D C;

void main() {
  for (float i = -40.; i < 40.; i += 2.)
    O += texture(A, (.5 + i * X + gl_FragCoord.xy) / vec2(1920,1080))
      / (abs(i) + 2.) * .4;

  if (0. < X.x)
    O += pow(texture(C, gl_FragCoord.xy / vec2(1920, 1080)), vec4(.7));

  O.a = 1.;
}

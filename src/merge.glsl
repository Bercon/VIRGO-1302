#version 300 es
precision highp float;
precision highp sampler3D;

out vec4 O;

vec3 v(vec3 v) {
  float s = length(v);
  return vec3(
    atan(v.y, v.x) / 12.6 + .25,
    (acos(v.z / s) - .95) / 2.5,
    s < 2. ? (s - .5) / 3. : .5 + (s - 2.) / 32.
  );
}

uniform sampler3D A;
uniform sampler3D C;

void main() {
  vec3 s = vec3(
    gl_FragCoord.xy,
    X.y + .5
  ) / 128., d = s;
  float g = d.z > .5 ? 4.2 : 15.;
  d.xy = 2. * g * d.xy - g,
  g = H(d);
  d.z =  2. * g * fract(d.z * 2.) - g;
  O =
    mix(texture(C, s),
    texture(A, v(d + vec3(g = 2.1 * smoothstep(121., 127., X.x), 0, .3)))
    + texture(A, v(d + vec3(-g, 0, .3)) + vec3(.5,0,0))
    + texture(A, v(d + vec3(g, 0, -.3)) + vec3(0,.5,0))
    + texture(A, v(d + vec3(-g, 0, -.3)) + vec3(.5,.5,0))
   ,
   .03
   )
  ;
}

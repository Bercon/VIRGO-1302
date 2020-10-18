#version 300 es
precision highp float;
precision highp sampler3D;

out vec4 O[2];

uniform sampler3D A;

void main() {
  vec3 s = vec3(
    gl_FragCoord.xy,
    X.y + .5
  ) / 128.;

  vec3 d = vec3(
    s.z < .5
      ? .5 + s.z * 3.
      : 2. + (s.z - .5) * 32.,
    .95 + fract(s.y * 2.) * 1.25,
    (fract(s.x * 2.) - .5) * 6.2832
  );

  O[1] =
    min(X.y, 1.) * texture(A, vec3(s.xy, .5 / 128.))
      + V(vec3(
        2.1 * smoothstep(121., 127., X.x)
        * sign(s.x - .5) + d.x * sin(d.y) * cos(d.z),
        d.x * sin(d.y) * sin(d.z),
        d.x * cos(d.y) + sign(s.y - .5) * .3
    ))
    * (s.z < .5 ? .015 : .12)
    ;
  O[0] = exp(-O[1]) / d.x;
}

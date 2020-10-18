#version 300 es
precision highp float;
precision highp sampler3D;

out vec4 O;

uniform sampler3D A;

void main() {

  vec4 path =
    //  radius,     z,        pan,    tilt
      vec4(   14,    4.5,       4,       .5)
    + vec4(-1,      -1,      -1.4,     -.9) * smoothstep(2., 23., X.x)
    + vec4(.5,       -7,       .6,      1) * smoothstep(21., 39., X.x)
    + vec4(.5,       3,         -1.1,     -.3) * smoothstep(35., 45., X.x)
    + vec4(-12.3,   .6,      -.4,      -.3) * smoothstep(43., 82., X.x)
    + vec4(-.5,      .1,      -.8,     -.1) * smoothstep(78., 92., X.x)
    + vec4(2,      .1,         .75,     0) * smoothstep(88., 123., X.x)
    + vec4(10.5,    4.7,      -.05,    -.3) * smoothstep(121., 135., X.x)
    + vec4(-10,     -6,         .1,      .5) * smoothstep(136., 174., X.x)
    + vec4(-1,      1.2,         .4,    -.1) * smoothstep(170., 194., X.x)
    + vec4(-1.5,        -.1,        -2,     .4) * smoothstep(184., 210., X.x)
    + vec4(-1.2,      -.1,       -1.5,     -.4) * smoothstep(205., 229., X.x)
  ;
  vec3 bhO = vec3(2.1 * smoothstep(121., 127., X.x), 0, 0);
  vec3 uv = J(vec3(gl_FragCoord.xy, X.x));
  vec3 position = vec3(
      cos(.04 * X.x + .066 * (X.x - 121.) * smoothstep(121., 127., X.x)),
      sin(.04 * X.x + .066 * (X.x - 121.) * smoothstep(121., 127., X.x)),
      1
    ) * path.xxy;
  vec3 rD = R(vec3(0,0,1), // rDy + Pan
    path.z, normalize(vec3(-position.y, position.x, 0)));
  vec3 rDx = R(rD, // rDx + Roll
    .3 * sin(X.x * .05),
    -normalize(vec3(-rD.y, rD.x, 0))
  );
  rD = R(rDx, path.w, rD); // Tilt
  uv.xy = (gl_FragCoord.xy - .5 * (uv.xy + vec2(1920, 1080))) / 1080.;
  rD = normalize(rD + rDx * uv.x + cross(rDx, rD) * uv.y);
  position += bhO * smoothstep(170., 210., X.x);

	O.a = 1.;
  for (float currentStep = .0, i = .0; i < 150.; i++) {
    position += rD * currentStep;

    float dist2;
    float angle;
    float redshift;
    float distanceToBlackhole = 20.;
    float forwardScattering = 1.;

    // First black hole
    rDx = position - bhO;
    forwardScattering += max(0., dot(rD, normalize(bhO - position))) * .4;
    dist2 = length(rDx);
    angle = dot(rD, normalize(vec3(-rDx.y, rDx.x, 0)));
    distanceToBlackhole = min(dist2, distanceToBlackhole);
    redshift += angle / dist2 ;
    rD = normalize(rD -
      currentStep
      / dist2 / dist2 / dist2
      * rDx
      * (1. - .3 * angle * (1.57 - atan(abs(rDx.z) / length(rDx.xy) * .7)))
      * (.14 + .09 * smoothstep(121., 127., X.x))
    );

    // Second black hole
    rDx = position + bhO;
    forwardScattering += max(0., dot(rD, normalize(-bhO - position))) * .4;
    dist2 = length(rDx);
    angle = dot(rD, normalize(vec3(-rDx.y, rDx.x, 0)));
    distanceToBlackhole = min(dist2, distanceToBlackhole);
    redshift += angle / dist2 ;
    rD = normalize(rD -
      currentStep
      / dist2 / dist2 / dist2
      * rDx
      * (1. - .3 * angle * (1.57 - atan(abs(rDx.z) / length(rDx.xy) * .7)))
      * (.14 + .09 * smoothstep(121., 127., X.x))
    );

    if (225. < dot(position, position)) // Escaped to space
        break;

    if (.00001 > O.a)  // Fully occluded
        break;

    if (min(path.x, .19) > distanceToBlackhole) // Sucked into the black hole
        break;

    vec4 currentSample = V(position);
    if (.19 < distanceToBlackhole) {
      if (.00001 < currentSample.x) {
        float light = texture(A,
          max(abs(position.x), abs(position.y)) < 4.2 ?
            vec3(
              position.xy / 8.4 + .5,
              position.z / currentSample.z / 4. + .75
            ) :
            vec3(
              position.xy / 30. + .5,
              position.z / currentSample.z / 4. + .25
            )
        ).x;
        O.rgb +=
          O.a
          * mix(vec3(.82,.8,1), vec3(1, .8, .8) * .83,
            -redshift * (1. + .75 * smoothstep(121., 127., X.x)))
          * mix(vec3(.82,.8,1), vec3(1, .8, .8),
            .3 * light * distanceToBlackhole)
          * (1. - exp(-currentSample.x * currentStep))
          * 1.6 * light * forwardScattering
        ;
        O.a *= exp(-currentSample.x * currentStep);
      }

      O.rgb += O.a / (1. + distanceToBlackhole * distanceToBlackhole)
        * .1 * currentStep;
    }

    currentStep = max(
      (.005 + .05 * smoothstep(2., 4., distanceToBlackhole))
        * (1.1 + .002 * i * i),
        min(min(1., distanceToBlackhole / 2.), currentSample.y)
      )
      // Randomize step length to turn visible artifacts into noise
      * (.95 + .05 * uv.z)
    ;
  }

  if (225. < dot(position, position)) // Star field
    O.rgb +=
      O.a
      * mix(vec3(.82,.8,1), vec3(1, .8, .8) * .8, 5. * N(rD * 3.) - 2.)
      * (.01
        + smoothstep(.88, 1., N(rD * 128.))
        )
    ;

  O *= .12 + .5 * smoothstep(3., 12., path.x); // Automatic exposure
}

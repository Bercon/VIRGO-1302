uniform vec2 X;

float H(vec3 p) { // Height, z axis is ignored
  float pow2Dist = dot(p.xy, p.xy) * .005;
  return min(1., .015 + .3 * pow2Dist + .685 * pow2Dist * pow2Dist) * 5.;
}

vec3 J(vec3 p) { // Pseudo RNG
	p = fract(p * vec3(.1031, .1030, .0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx) * 2. - 1.;
}

float N(vec3 p) { // Simplex 3D noise
  vec3 s = floor(p + (p.x + p.y + p.z) / 3.);
  vec3 x = p - s + (s.x + s.y + s.z) / 6.;
  vec3 i = step(x.yzx, x);
	vec3 i1 = i * (1. - i.zxy);
  vec3 i2 = 1. - i.zxy * (1. - i);
	vec3 x1 = x - i1 + 1. / 6.;
	vec3 x2 = x - i2 + 1. / 3.;
	vec3 x3 = x - .5;
	vec4 w =
  max(
    .6 - vec4(
    dot(x, x),
  	dot(x1, x1),
	  dot(x2, x2),
	  dot(x3, x3)
  )
  , 0.)
  ;
	return
    .5 + 18. * dot(
    vec4(
      dot(J(s), x),
      dot(J(s + i1), x1),
      dot(J(s + i2), x2),
      dot(J(s + 1.), x3)
    ),
    w * w * w * w
  );
}

vec3 R(vec3 k, float a, vec3 v) { // Rotating vector around another
    return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1. - cos(a));
}

vec3 U(vec3 uv, float dist, float z) { // Spiral
  dist = pow(dist / 8., .5 + .7 * smoothstep(1., 25., dist));
  float normTheta = atan(uv.y, uv.x) / 6.2832;
  float x = floor(dist + 1. - normTheta) + normTheta;
  float widthAdjustment = smoothstep(1.4, 3., x *= x); // Notice x *= x
  float y = fract(normTheta - dist) + .05 * (1. - widthAdjustment);
  return vec3(
    x / (1. + .1 * x),
    y / (1. + .4 * x),
    1. - length(vec2(abs(1. - 2. * y) / (.15 + .45 * widthAdjustment), z))
  );
}

vec4 V(vec3 p) { // Volumetric density function

  float density;
  float height = H(p);
  float time = X.x - 40. * smoothstep(116., 129., X.x);

  vec3 rotatingP = vec3(2.1 * smoothstep(121., 127., X.x), 0, 0);
  vec3 distVectorA = p - rotatingP * smoothstep(8., 2., length(p - rotatingP));
  vec3 distVectorB = p + rotatingP * smoothstep(8., 2., length(p + rotatingP));

  float distA = length(distVectorA);
  float distB = length(distVectorB);
  float distClosest = min(distA, distB);
  float distEstimate = max(abs(p.z) - height, distClosest - 2.);

  vec3 spiralUV = U(distVectorA, distA, p.z / height);
  vec3 spiralUVB = U(-distVectorB, distB, p.z / height) + vec3(8,0,0);

  if (.0 > distEstimate) {
    rotatingP = R(vec3(0,0,1), time * .1,
      p.x > J(p).x * .1 ? distVectorA : distVectorB);
    distB =  N(rotatingP * 7.);
    distA = smoothstep(.1, 1., N(rotatingP * 2.));
    density = smoothstep(.5, .55, distClosest) // Inner fade
      * smoothstep(2., 1.8, distClosest * (1. + .1 * distA)) // Outter fade
      * smoothstep(
        smoothstep(-.1, 1.,
          N(R(
              vec3(0,0,1),
              5. / (.6 + .5 * distClosest * distClosest),
              rotatingP * 1.5 + .3 * distA - time * vec3(0,0,.05)))
        ) * height * (.8 + .6 * N(rotatingP * 15.) * distB)
        , 0., abs(p.z)) // Height fade
        * distB * distB
      ;
    if (.0001 < density) {
      distB = N(rotatingP * 30.);
      density *= .1 + distB * distB;
      distB = N(rotatingP * 60.);
      density *= .2 + distB * distB;
      distB = N(rotatingP * 120.);
      density *= .9 + 3. * distB * distB;
    }
  }

  distEstimate = min(
    distEstimate,
    // Distance to spiral, aprox
    -max(spiralUV.z, spiralUVB.z) * (.1 + .15 * distClosest)
  );

  if (spiralUVB.z > spiralUV.z)
    spiralUV = spiralUVB;

  if (.0 < (spiralUV.z *= smoothstep(1., 2., distClosest))) {
    rotatingP = vec3(20. * spiralUV.xy,
      p.z / (.6 + .04 * distClosest)) - time * vec3(1.2, 0, 0);
    time = density;
    density = mix(distB = N(rotatingP * 1.), 1.,
      .3 + .5 * smoothstep(3., 10., distClosest));
    density = max(0., spiralUV.z - 1. + density) / density
      * smoothstep(.3, .6, N(rotatingP * .5))
      * distB * distB
    ;
    if (.0001 < density) {
      distB = N(rotatingP * 2.);
      density *= distB * distB;
      distB = N(rotatingP * 4.);
      density *= .1 + distB * distB;
      distB = N(rotatingP * 8.);
      density *= .2 + distB * distB;
    }
    density += time;
  }

  return vec4(
    density * 600.,
    distEstimate,
    height,
    0
  );
}

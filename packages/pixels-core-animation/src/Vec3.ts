export interface Vec3 {
  xTimes1000: number;
  yTimes1000: number;
  zTimes1000: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return {
    xTimes1000: x * 1000,
    yTimes1000: y * 1000,
    zTimes1000: z * 1000,
  };
}

export function sqrMagnitudeTimes1000(v: Readonly<Vec3>): number {
  return (
    (v.xTimes1000 * v.xTimes1000 +
      v.yTimes1000 * v.yTimes1000 +
      v.zTimes1000 * v.zTimes1000) /
    1000
  );
}

export function magnitudeTimes1000(v: Readonly<Vec3>): number {
  return Math.sqrt(sqrMagnitudeTimes1000(v) * 1000);
}

export function normalize(v: Vec3): void {
  const magTimes1000 = magnitudeTimes1000(v);
  v.xTimes1000 = (v.xTimes1000 * 1000) / magTimes1000;
  v.yTimes1000 = (v.yTimes1000 * 1000) / magTimes1000;
  v.zTimes1000 = (v.zTimes1000 * 1000) / magTimes1000;
}

export function dotTimes1000(
  left: Readonly<Vec3>,
  right: Readonly<Vec3>
): number {
  return (
    (left.xTimes1000 * right.xTimes1000 +
      left.yTimes1000 * right.yTimes1000 +
      left.zTimes1000 * right.zTimes1000) /
    1000
  );
}

export function cross(left: Readonly<Vec3>, right: Readonly<Vec3>): Vec3 {
  return {
    xTimes1000:
      (left.yTimes1000 * right.zTimes1000 -
        left.zTimes1000 * right.yTimes1000) /
      1000,
    yTimes1000:
      (left.zTimes1000 * right.xTimes1000 -
        left.xTimes1000 * right.zTimes1000) /
      1000,
    zTimes1000:
      (left.xTimes1000 * right.yTimes1000 -
        left.yTimes1000 * right.xTimes1000) /
      1000,
  };
}

export function sub(v: Readonly<Vec3>, right: Readonly<Vec3>): Vec3 {
  return {
    xTimes1000: v.xTimes1000 - right.xTimes1000,
    yTimes1000: v.yTimes1000 - right.yTimes1000,
    zTimes1000: v.zTimes1000 - right.zTimes1000,
  };
}

export function mul(left: Readonly<Vec3>, right: Readonly<Vec3>): Vec3 {
  return {
    xTimes1000: (left.xTimes1000 * right.xTimes1000) / 1000,
    yTimes1000: (left.yTimes1000 * right.yTimes1000) / 1000,
    zTimes1000: (left.zTimes1000 * right.zTimes1000) / 1000,
  };
}

export function mulScalar(v: Readonly<Vec3>, rightTimes1000: number): Vec3 {
  return {
    xTimes1000: (v.xTimes1000 * rightTimes1000) / 1000,
    yTimes1000: (v.yTimes1000 * rightTimes1000) / 1000,
    zTimes1000: (v.zTimes1000 * rightTimes1000) / 1000,
  };
}

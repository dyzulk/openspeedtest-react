const SCALE = [
  { value: 0, degree: 681.1 },
  { value: 0.5, degree: 570 },
  { value: 1, degree: 460 },
  { value: 10, degree: 337 },
  { value: 100, degree: 220 },
  { value: 500, degree: 115 },
  { value: 1000, degree: 0 }
];

export function getNonlinearOffset(speed: number): number {
  if (speed <= 0 || isNaN(speed)) {
    return 681.1;
  }
  if (speed >= 1000) {
    return 0;
  }
  for (let i = 1; i < SCALE.length; i++) {
    if (speed <= SCALE[i].value) {
      const prev = SCALE[i - 1];
      const curr = SCALE[i];
      const ratio = (speed - prev.value) / (curr.value - prev.value);
      return prev.degree + ratio * (curr.degree - prev.degree);
    }
  }
  return 0;
}

export function easeOutCubic(t: number, b: number, c: number, d: number): number {
  t /= d;
  t--;
  return c * (t * t * t + 1) + b;
}

export function easeOutQuint(t: number, b: number, c: number, d: number): number {
  t /= d;
  t--;
  return c * (t * t * t * t * t + 1) + b;
}

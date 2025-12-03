export const convolve = (x: number[], h: number[]): number[] => {
  const m = x.length;
  const n = h.length;
  const y = new Array(m + n - 1).fill(0);

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      y[i + j] += x[i] * h[j];
    }
  }
  return y;
};

// Calculate single point of convolution y[n]
export const calculateSingleStep = (x: number[], h: number[], n: number): {
  products: { k: number; val: number }[];
  sum: number;
} => {
  let sum = 0;
  const products: { k: number; val: number }[] = [];
  
  // y[n] = sum(x[k] * h[n-k])
  // We iterate k over valid range of x
  for (let k = 0; k < x.length; k++) {
    const hIndex = n - k;
    if (hIndex >= 0 && hIndex < h.length) {
      const val = x[k] * h[hIndex];
      sum += val;
      products.push({ k, val });
    }
  }
  return { products, sum };
};

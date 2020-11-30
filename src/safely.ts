const safely = <F extends (...args: any) => any>(
  f: F,
  ...args: Parameters<F>
): ReturnType<F> | undefined => {
  try {
    return f(...args);
  } catch {
    return undefined;
  }
};

export default safely;

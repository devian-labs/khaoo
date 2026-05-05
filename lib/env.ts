export const col = (name: string) =>
  process.env.NEXT_PUBLIC_USE_DEV_DB === "true" ? `dev_${name}` : name;

export const generateId = (): string => {
  // Generate a random string that looks like a UUID
  const timestamp = new Date().getTime();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
};

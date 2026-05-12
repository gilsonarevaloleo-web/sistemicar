export const OWNER_EMAIL = "gilsonarevalo.leo@gmail.com";

export const isOwner = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
};

export const hasFullAccess = (email: string | null | undefined, rank?: string): boolean => {
  if (isOwner(email)) return true;
  return rank === "arquitecto";
};

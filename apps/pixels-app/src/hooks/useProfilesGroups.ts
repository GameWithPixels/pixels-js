import { useProfilesList } from "./useProfilesList";

export function useProfilesGroups(): string[] {
  // TODO a new list is returned every time, so this is not memoized
  return [
    ...new Set(
      useProfilesList()
        .map((p) => p.group)
        .filter(Boolean)
    ),
  ];
}

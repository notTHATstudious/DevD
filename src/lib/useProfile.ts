import { useSyncExternalStore } from "react";
import { DEFAULT_PROFILE, profileStore, type Profile } from "@/lib/stacks";

/** The visitor's track and stacks. `answered` is false until the first-visit question is done. */
export function useProfile() {
  const stored = useSyncExternalStore(profileStore.subscribe, profileStore.get);
  return {
    profile: stored ?? DEFAULT_PROFILE,
    answered: stored !== null,
    setProfile: (p: Profile) => profileStore.set(p),
  };
}

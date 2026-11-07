import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/localStore";

export type FeedView = "card" | "list";

const store = createLocalStore<FeedView>({
  key: "dailyd_view",
  parse: (raw) => (raw === "list" ? "list" : "card"),
});

export function useFeedView(): FeedView {
  return useSyncExternalStore(store.subscribe, store.get);
}

export function toggleFeedView(): void {
  store.set(store.get() === "card" ? "list" : "card");
}

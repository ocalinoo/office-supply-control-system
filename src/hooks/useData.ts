import useSWR from "swr";
import { useAppStore } from "@/store/app-store";

const fetcher = async (url: string) => {
  const token = useAppStore.getState().token;
  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "An error occurred");
  }
  return res.json();
};

export function useInventory() {
  const { data, error, isLoading, mutate } = useSWR("/api/inventory", fetcher);
  return {
    inventory: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useCategories(includeEmpty: boolean = false) {
  const url = includeEmpty ? "/api/categories?includeEmpty=true" : "/api/categories?includeEmpty=false";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  return {
    categories: data,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/stats", fetcher);
  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  };
}

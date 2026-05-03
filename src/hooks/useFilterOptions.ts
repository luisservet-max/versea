import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAvailableLanguages = () => {
  return useQuery({
    queryKey: ["available-languages-v4"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_distinct_languages");
      if (error) throw error;
      return (data || []).map((r: any) => r.language).filter(Boolean) as string[];
    },
    staleTime: 0,
    gcTime: 0,
  });
};

export const useAvailableTags = () => {
  return useQuery({
    queryKey: ["available-tags-v4"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("tags")
        .limit(500);
      if (error) throw error;
      const tagSet = new Set<string>();
      (data || []).forEach((r: any) => {
        (r.tags || []).forEach((t: string) => tagSet.add(t));
      });
      return Array.from(tagSet).sort();
    },
    staleTime: 0,
    gcTime: 0,
  });
};

export const useAvailableStyles = () => {
  return useQuery({
    queryKey: ["available-styles-v4"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_distinct_styles");
      if (error) throw error;
      return (data || []).map((r: any) => r.style).filter(Boolean) as string[];
    },
    staleTime: 0,
    gcTime: 0,
  });
};

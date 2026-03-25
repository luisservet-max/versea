import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAvailableLanguages = () => {
  return useQuery({
    queryKey: ["available-languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("language");
      if (error) throw error;
      const langs = new Set((data || []).map((r) => r.language).filter(Boolean));
      return Array.from(langs).sort();
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAvailableTags = () => {
  return useQuery({
    queryKey: ["available-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("tags");
      if (error) throw error;
      const tagSet = new Set<string>();
      (data || []).forEach((r) => {
        (r.tags || []).forEach((t: string) => tagSet.add(t));
      });
      return Array.from(tagSet).sort();
    },
    staleTime: 5 * 60 * 1000,
  });
};

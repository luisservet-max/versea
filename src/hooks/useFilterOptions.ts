import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAvailableLanguages = () => {
  return useQuery({
    queryKey: ["available-languages-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("language")
        .not("language", "is", null);
      if (error) throw error;
      const langs = [...new Set((data || []).map((r: any) => r.language).filter(Boolean))].sort();
      return langs;
    },
    staleTime: 0,
    gcTime: 0,
  });
};

export const useAvailableTags = () => {
  return useQuery({
    queryKey: ["available-tags-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("tags");
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
    queryKey: ["available-styles-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("style")
        .not("style", "is", null);
      if (error) throw error;
      const styleSet = [...new Set((data || []).map((r: any) => r.style).filter(Boolean))].sort();
      return styleSet;
    },
    staleTime: 0,
    gcTime: 0,
  });
};

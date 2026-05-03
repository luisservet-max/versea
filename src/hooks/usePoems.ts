import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PoemWithAuthor {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  tags: string[] | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  is_classic: boolean;
  language: string;
  style: string | null;
  period: string | null;
  publication_year: number | null;
}

function mapPoem(row: any): PoemWithAuthor {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    excerpt: row.excerpt,
    tags: row.tags,
    user_id: row.user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author_name: row.author_name || "Anonymous",
    is_classic: !row.user_id,
    language: row.language || "English",
    style: row.style || null,
    period: row.period || null,
    publication_year: row.publication_year || null,
  };
}

const PAGE_SIZE = 18;

// Reads from trending_cache — refreshed every hour by cron, instant to query
export const useHotPoems = () => {
  return useQuery({
    queryKey: ["hot-poems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trending_cache")
        .select("poem_id, like_count, poems(*)")
        .order("like_count", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || [])
        .map((row: any) => row.poems)
        .filter(Boolean)
        .map(mapPoem);
    },
    staleTime: 10 * 60 * 1000, // consider fresh for 10 minutes
  });
};

export const usePoems = (options?: {
  tag?: string | null;
  search?: string;
  source?: "all" | "classic" | "community";
  language?: string | null;
  style?: string | null;
}) => {
  return useInfiniteQuery({
    queryKey: ["poems", options?.tag, options?.search, options?.source, options?.language, options?.style],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("poems")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (options?.tag) query = query.contains("tags", [options.tag]);
      if (options?.search) {
        query = query.or(
          `title.ilike.%${options.search}%,content.ilike.%${options.search}%,author_name.ilike.%${options.search}%`
        );
      }
      if (options?.source === "classic") query = query.is("user_id", null);
      else if (options?.source === "community") query = query.not("user_id", "is", null);
      if (options?.language) query = query.eq("language", options.language);
      if (options?.style) query = query.eq("style", options.style);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapPoem);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.flat().length;
    },
  });
};

export const usePoem = (id: string | undefined) => {
  return useQuery({
    queryKey: ["poem", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return mapPoem(data);
    },
  });
};

export const useMyPoems = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-poems", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapPoem);
    },
  });
};

export const usePublishPoem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (poem: {
      title: string;
      content: string;
      tags: string[];
      language?: string;
      style?: string;
    }) => {
      if (!user) throw new Error("Must be signed in");

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const authorName =
        profile?.display_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Anonymous";

      const lines = poem.content.trim().split("\n");
      const excerpt = lines.slice(0, 2).join("\n");

      const { data, error } = await supabase
        .from("poems")
        .insert({
          user_id: user.id,
          title: poem.title.trim(),
          content: poem.content.trim(),
          excerpt: excerpt.length > 120 ? excerpt.substring(0, 120) + "..." : excerpt,
          tags: poem.tags,
          author_name: authorName,
          language: poem.language || "English",
          style: poem.style || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["my-poems"] });
      queryClient.invalidateQueries({ queryKey: ["available-styles"] });
      queryClient.invalidateQueries({ queryKey: ["available-languages"] });
    },
  });
};

export const useUpdatePoem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poem: {
      id: string;
      title: string;
      content: string;
      tags: string[];
      language?: string;
      style?: string;
    }) => {
      const lines = poem.content.trim().split("\n");
      const excerpt = lines.slice(0, 2).join("\n");

      const { data, error } = await supabase
        .from("poems")
        .update({
          title: poem.title.trim(),
          content: poem.content.trim(),
          excerpt: excerpt.length > 120 ? excerpt.substring(0, 120) + "..." : excerpt,
          tags: poem.tags,
          language: poem.language || "English",
          style: poem.style || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", poem.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["my-poems"] });
      queryClient.invalidateQueries({ queryKey: ["poem", data.id] });
      queryClient.invalidateQueries({ queryKey: ["available-styles"] });
    },
  });
};

export const useDeletePoem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poemId: string) => {
      const { error } = await supabase.from("poems").delete().eq("id", poemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["my-poems"] });
      queryClient.invalidateQueries({ queryKey: ["available-styles"] });
    },
  });
};

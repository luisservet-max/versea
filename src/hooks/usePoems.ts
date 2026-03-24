import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PoemWithAuthor {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  tags: string[] | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  author_name: string;
}

export const usePoems = (options?: { tag?: string | null; search?: string }) => {
  return useQuery({
    queryKey: ["poems", options?.tag, options?.search],
    queryFn: async () => {
      let query = supabase
        .from("poems")
        .select("*, profiles!inner(display_name)")
        .order("created_at", { ascending: false });

      if (options?.tag) {
        query = query.contains("tags", [options.tag]);
      }

      if (options?.search) {
        query = query.or(
          `title.ilike.%${options.search}%,content.ilike.%${options.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        tags: row.tags,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_name: row.profiles?.display_name || "Anonymous",
      })) as PoemWithAuthor[];
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
        .select("*, profiles!inner(display_name)")
        .eq("id", id!)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        tags: data.tags,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author_name: (data as any).profiles?.display_name || "Anonymous",
      } as PoemWithAuthor;
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
        .select("*, profiles!inner(display_name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        excerpt: row.excerpt,
        tags: row.tags,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_name: row.profiles?.display_name || "Anonymous",
      })) as PoemWithAuthor[];
    },
  });
};

export const usePublishPoem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (poem: { title: string; content: string; tags: string[] }) => {
      if (!user) throw new Error("Must be signed in");

      const excerpt = poem.content.split("\n").slice(0, 2).join("\n");

      const { data, error } = await supabase
        .from("poems")
        .insert({
          user_id: user.id,
          title: poem.title.trim(),
          content: poem.content.trim(),
          excerpt: excerpt.length > 100 ? excerpt.substring(0, 100) + "..." : excerpt,
          tags: poem.tags,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poems"] });
      queryClient.invalidateQueries({ queryKey: ["my-poems"] });
    },
  });
};

export const useLikeCount = (poemId: string) => {
  return useQuery({
    queryKey: ["likes", poemId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("poem_id", poemId);
      if (error) throw error;
      return count || 0;
    },
  });
};

export const useCommentCount = (poemId: string) => {
  return useQuery({
    queryKey: ["comment-count", poemId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("poem_id", poemId);
      if (error) throw error;
      return count || 0;
    },
  });
};

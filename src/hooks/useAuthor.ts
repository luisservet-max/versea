import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuthorProfile {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  poem_count: number;
  total_likes: number;
}

export const useAuthorProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["author-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (profileError) throw profileError;

      // Get poem count
      const { count: poemCount } = await supabase
        .from("poems")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId!);

      // Get total likes across all poems
      const { data: userPoems } = await supabase
        .from("poems")
        .select("id")
        .eq("user_id", userId!);

      let totalLikes = 0;
      if (userPoems && userPoems.length > 0) {
        const poemIds = userPoems.map((p) => p.id);
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("poem_id", poemIds);
        totalLikes = count || 0;
      }

      return {
        user_id: userId!,
        display_name: (profile as any)?.display_name || "Anonymous",
        bio: (profile as any)?.bio || null,
        avatar_url: (profile as any)?.avatar_url || null,
        poem_count: poemCount || 0,
        total_likes: totalLikes,
      } as AuthorProfile;
    },
  });
};

export const useAuthorPoems = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["author-poems", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poems")
        .select("*")
        .eq("user_id", userId!)
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
        author_name: row.author_name || "Anonymous",
        is_classic: !row.user_id,
        language: row.language || "English",
      }));
    },
  });
};

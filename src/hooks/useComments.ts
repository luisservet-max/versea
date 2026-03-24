import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CommentWithAuthor {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string;
}

export const useComments = (poemId: string) => {
  return useQuery({
    queryKey: ["comments", poemId],
    enabled: !!poemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("poem_id", poemId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      // Fetch display names for comment authors
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profileMap = Object.fromEntries(
          (profiles || []).map((p: any) => [p.user_id, p.display_name])
        );
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        content: row.content,
        created_at: row.created_at,
        user_id: row.user_id,
        author_name: profileMap[row.user_id] || "Anonymous",
      })) as CommentWithAuthor[];
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

export const usePostComment = (poemId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be signed in");
      const { error } = await supabase
        .from("comments")
        .insert({ poem_id: poemId, user_id: user.id, content: content.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", poemId] });
      queryClient.invalidateQueries({ queryKey: ["comment-count", poemId] });
    },
  });
};

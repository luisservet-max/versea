import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export const useUserLiked = (poemId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-liked", poemId, user?.id],
    enabled: !!user && !!poemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("poem_id", poemId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
};

export const useToggleLike = (poemId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (currentlyLiked: boolean) => {
      if (!user) throw new Error("Must be signed in");
      if (currentlyLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("poem_id", poemId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("likes")
          .insert({ poem_id: poemId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["likes", poemId] });
      queryClient.invalidateQueries({ queryKey: ["user-liked", poemId] });
    },
  });
};

export const useSavedStatus = (poemId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved", poemId, user?.id],
    enabled: !!user && !!poemId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_poems")
        .select("id")
        .eq("poem_id", poemId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
};

export const useToggleSave = (poemId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (currentlySaved: boolean) => {
      if (!user) throw new Error("Must be signed in");
      if (currentlySaved) {
        const { error } = await supabase
          .from("saved_poems")
          .delete()
          .eq("poem_id", poemId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_poems")
          .insert({ poem_id: poemId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved", poemId] });
      queryClient.invalidateQueries({ queryKey: ["saved-poems"] });
    },
  });
};

export const useSavedPoems = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved-poems", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_poems")
        .select("poem_id, poems(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row: any) => {
        const p = row.poems;
        return {
          id: p.id,
          title: p.title,
          content: p.content,
          excerpt: p.excerpt,
          tags: p.tags,
          user_id: p.user_id,
          created_at: p.created_at,
          updated_at: p.updated_at,
          author_name: p.author_name || "Anonymous",
          is_classic: !p.user_id,
          language: p.language || "English",
        };
      });
    },
  });
};

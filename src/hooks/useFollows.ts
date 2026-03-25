import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useFollowStatus = (targetUserId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["follow-status", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", targetUserId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
};

export const useToggleFollow = (targetUserId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (!user) throw new Error("Must be signed in");
      if (currentlyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["follower-count", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["following-count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["activity-feed"] });
      queryClient.invalidateQueries({ queryKey: ["following-list"] });
    },
  });
};

export const useFollowerCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["follower-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId!);
      if (error) throw error;
      return count || 0;
    },
  });
};

export const useFollowingCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["following-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId!);
      if (error) throw error;
      return count || 0;
    },
  });
};

export const useFollowingList = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["following-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      if (error) throw error;
      return (data || []).map((r: any) => r.following_id as string);
    },
  });
};

export const useActivityFeed = () => {
  const { user } = useAuth();
  const { data: followingIds = [] } = useFollowingList();

  return useQuery({
    queryKey: ["activity-feed", user?.id, followingIds],
    enabled: !!user && followingIds.length > 0,
    queryFn: async () => {
      // Fetch poems by followed users
      const { data: poems } = await supabase
        .from("poems")
        .select("id, title, excerpt, author_name, user_id, created_at, tags, language")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch likes by followed users
      const { data: likes } = await supabase
        .from("likes")
        .select("id, user_id, poem_id, created_at")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch comments by followed users
      const { data: comments } = await supabase
        .from("comments")
        .select("id, user_id, poem_id, content, created_at")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch saved poems by followed users (only those with public catalogs)
      const { data: publicProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .in("user_id", followingIds)
        .eq("catalog_public", true);
      const publicUserIds = (publicProfiles || []).map((p: any) => p.user_id);

      let saves: any[] = [];
      if (publicUserIds.length > 0) {
        const { data: savedData } = await supabase
          .from("saved_poems")
          .select("id, user_id, poem_id, created_at")
          .in("user_id", publicUserIds)
          .order("created_at", { ascending: false })
          .limit(50);
        saves = savedData || [];
      }

      // Get display names for all involved users
      const allUserIds = [...new Set([
        ...(poems || []).map((p: any) => p.user_id),
        ...(likes || []).map((l: any) => l.user_id),
        ...(comments || []).map((c: any) => c.user_id),
        ...saves.map((s: any) => s.user_id),
      ])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", allUserIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name || "Anonymous"; });

      // Get poem titles for likes, comments, saves
      const poemIds = [...new Set([
        ...(likes || []).map((l: any) => l.poem_id),
        ...(comments || []).map((c: any) => c.poem_id),
        ...saves.map((s: any) => s.poem_id),
      ])];
      
      let poemTitleMap: Record<string, string> = {};
      if (poemIds.length > 0) {
        const { data: poemData } = await supabase
          .from("poems")
          .select("id, title")
          .in("id", poemIds);
        (poemData || []).forEach((p: any) => { poemTitleMap[p.id] = p.title; });
      }

      // Build unified feed
      type FeedItem = {
        id: string;
        type: "poem" | "like" | "comment" | "save";
        user_id: string;
        user_name: string;
        poem_id: string;
        poem_title: string;
        content?: string;
        created_at: string;
      };

      const feed: FeedItem[] = [];

      (poems || []).forEach((p: any) => feed.push({
        id: `poem-${p.id}`,
        type: "poem",
        user_id: p.user_id,
        user_name: nameMap[p.user_id] || p.author_name || "Anonymous",
        poem_id: p.id,
        poem_title: p.title,
        content: p.excerpt,
        created_at: p.created_at,
      }));

      (likes || []).forEach((l: any) => feed.push({
        id: `like-${l.id}`,
        type: "like",
        user_id: l.user_id,
        user_name: nameMap[l.user_id] || "Anonymous",
        poem_id: l.poem_id,
        poem_title: poemTitleMap[l.poem_id] || "a poem",
        created_at: l.created_at,
      }));

      (comments || []).forEach((c: any) => feed.push({
        id: `comment-${c.id}`,
        type: "comment",
        user_id: c.user_id,
        user_name: nameMap[c.user_id] || "Anonymous",
        poem_id: c.poem_id,
        poem_title: poemTitleMap[c.poem_id] || "a poem",
        content: c.content,
        created_at: c.created_at,
      }));

      saves.forEach((s: any) => feed.push({
        id: `save-${s.id}`,
        type: "save",
        user_id: s.user_id,
        user_name: nameMap[s.user_id] || "Anonymous",
        poem_id: s.poem_id,
        poem_title: poemTitleMap[s.poem_id] || "a poem",
        created_at: s.created_at,
      }));

      // Sort by time
      feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return feed;
    },
  });
};

export const useCatalogPrivacy = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["catalog-privacy", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("catalog_public")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.catalog_public ?? false;
    },
  });

  const mutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      if (!user) throw new Error("Must be signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ catalog_public: isPublic } as any)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-privacy"] });
    },
  });

  return { isPublic: query.data ?? false, isLoading: query.isLoading, togglePrivacy: mutation };
};

export const useUserSavedPoems = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-saved-poems", userId],
    enabled: !!userId,
    queryFn: async () => {
      // Check if catalog is public
      const { data: profile } = await supabase
        .from("profiles")
        .select("catalog_public")
        .eq("user_id", userId!)
        .maybeSingle();
      
      if (!(profile as any)?.catalog_public) {
        return { poems: [], isPublic: false };
      }

      const { data, error } = await supabase
        .from("saved_poems")
        .select("poem_id, poems(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const poems = (data || []).map((row: any) => {
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

      return { poems, isPublic: true };
    },
  });
};

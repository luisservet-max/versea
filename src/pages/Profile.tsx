import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User, Save, Loader2, Feather, BookOpen, Heart,
  Users, Eye, EyeOff, Shield, Settings, Pencil, Lock, UserPlus, X
} from "lucide-react";

type PanelType = "followers" | "following" | null;

const Profile = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["my-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [poemsRes, followersRes, followingRes] = await Promise.all([
        supabase.from("poems").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user!.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user!.id),
      ]);
      const { data: userPoems } = await supabase.from("poems").select("id").eq("user_id", user!.id);
      let totalLikes = 0;
      if (userPoems && userPoems.length > 0) {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("poem_id", userPoems.map((p) => p.id));
        totalLikes = count || 0;
      }
      return {
        poems: poemsRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        likes: totalLikes,
      };
    },
  });

  // Followers list
  const { data: followers = [] } = useQuery({
    queryKey: ["my-followers", user?.id],
    enabled: !!user && activePanel === "followers",
    queryFn: async () => {
      const { data: followRows, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!followRows || followRows.length === 0) return [];
      const followerIds = followRows.map((r: any) => r.follower_id);
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", followerIds);
      const profileMap: Record<string, any> = {};
      (profileRows || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      return followerIds.map((id: string) => ({
        user_id: id,
        display_name: profileMap[id]?.display_name || "Poet",
        avatar_url: profileMap[id]?.avatar_url || null,
      }));
    },
  });

  // Following list
  const { data: following = [] } = useQuery({
    queryKey: ["my-following-list", user?.id],
    enabled: !!user && activePanel === "following",
    queryFn: async () => {
      const { data: followRows, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!followRows || followRows.length === 0) return [];
      const followingIds = followRows.map((r: any) => r.following_id);
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", followingIds);
      const profileMap: Record<string, any> = {};
      (profileRows || []).forEach((p: any) => { profileMap[p.user_id] = p; });
      return followingIds.map((id: string) => ({
        user_id: id,
        display_name: profileMap[id]?.display_name || "Poet",
        avatar_url: profileMap[id]?.avatar_url || null,
      }));
    },
  });

  // Who I follow (for follow-back state on followers panel)
  const { data: myFollowingIds = [] } = useQuery({
    queryKey: ["my-following-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      return (data || []).map((r: any) => r.following_id);
    },
  });

  // Follow / unfollow
  const toggleFollow = useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: string; isFollowing: boolean }) => {
      if (isFollowing) {
        await supabase.from("follows").delete()
          .eq("follower_id", user!.id)
          .eq("following_id", targetId);
      } else {
        await supabase.from("follows").insert({
          follower_id: user!.id,
          following_id: targetId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-following-ids"] });
      queryClient.invalidateQueries({ queryKey: ["my-following-list"] });
      queryClient.invalidateQueries({ queryKey: ["my-stats"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Edit state
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName((profile as any).display_name || "");
      setBio((profile as any).bio || "");
      setAvatarUrl((profile as any).avatar_url || "");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success(t("profile_updated"));
      setEditing(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error(t("profile_password_min")); return; }
    if (newPassword !== confirmPassword) { toast.error(t("profile_password_mismatch")); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile_password_changed"));
      setNewPassword(""); setConfirmPassword(""); setShowPasswordSection(false);
    }
  };

  const handleStatClick = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex flex-col items-center justify-center py-20 text-center">
          <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">{t("profile_sign_in_prompt")}</p>
          <Link to="/auth" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {t("nav_sign_in")}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="container flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  const avatarDisplay = (profile as any)?.avatar_url;
  const nameDisplay = (profile as any)?.display_name || user.email?.split("@")[0] || "Poet";

  // The list to show in the panel
  const panelList = activePanel === "followers" ? followers : following;
  const panelTitle = activePanel === "followers" ? t("profile_followers") : t("profile_following");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container flex-1 py-10 max-w-2xl">

        {/* Profile header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            {avatarDisplay ? (
              <img src={avatarDisplay} alt={nameDisplay} className="h-24 w-24 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{nameDisplay}</h1>
          <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          {(profile as any)?.bio && !editing && (
            <p className="mt-3 text-sm text-muted-foreground max-w-md">{(profile as any).bio}</p>
          )}
        </div>

        {/* Stats — followers and following are clickable */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {/* Poems */}
          <div className="flex flex-col items-center rounded-lg border border-border bg-card p-3">
            <Feather className="h-4 w-4 text-accent mb-1" />
            <span className="text-lg font-bold text-foreground">{stats?.poems ?? 0}</span>
            <span className="text-xs text-muted-foreground">{t("profile_poems")}</span>
          </div>

          {/* Likes */}
          <div className="flex flex-col items-center rounded-lg border border-border bg-card p-3">
            <Heart className="h-4 w-4 text-accent mb-1" />
            <span className="text-lg font-bold text-foreground">{stats?.likes ?? 0}</span>
            <span className="text-xs text-muted-foreground">{t("profile_likes")}</span>
          </div>

          {/* Followers — clickable */}
          <button
            onClick={() => handleStatClick("followers")}
            className={`flex flex-col items-center rounded-lg border p-3 transition-colors ${
              activePanel === "followers"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-foreground hover:border-accent/50 hover:bg-accent/5"
            }`}
          >
            <Users className="h-4 w-4 text-accent mb-1" />
            <span className="text-lg font-bold">{stats?.followers ?? 0}</span>
            <span className="text-xs text-muted-foreground">{t("profile_followers")}</span>
          </button>

          {/* Following — clickable */}
          <button
            onClick={() => handleStatClick("following")}
            className={`flex flex-col items-center rounded-lg border p-3 transition-colors ${
              activePanel === "following"
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-foreground hover:border-accent/50 hover:bg-accent/5"
            }`}
          >
            <Users className="h-4 w-4 text-accent mb-1" />
            <span className="text-lg font-bold">{stats?.following ?? 0}</span>
            <span className="text-xs text-muted-foreground">{t("profile_following")}</span>
          </button>
        </div>

        {/* Expandable panel for followers / following */}
        {activePanel && (
          <div className="mb-6 animate-fade-in rounded-lg border border-accent/20 bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold text-foreground">{panelTitle}</h3>
              <button onClick={() => setActivePanel(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {panelList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {activePanel === "followers" ? t("feed_no_following") : t("feed_no_following")}
              </p>
            ) : (
              <div className="space-y-2.5">
                {panelList.map((person: any) => {
                  const isFollowingBack = myFollowingIds.includes(person.user_id);
                  return (
                    <div key={person.user_id} className="flex items-center justify-between gap-3">
                      <Link
                        to={`/author/${person.user_id}`}
                        onClick={() => setActivePanel(null)}
                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0"
                      >
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt={person.display_name}
                            className="h-8 w-8 rounded-full object-cover border border-border shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground truncate">{person.display_name}</span>
                      </Link>

                      {/* For followers panel: show follow-back button */}
                      {/* For following panel: show unfollow button */}
                      <button
                        onClick={() => toggleFollow.mutate({
                          targetId: person.user_id,
                          isFollowing: activePanel === "following" ? true : isFollowingBack,
                        })}
                        disabled={toggleFollow.isPending}
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                          activePanel === "following" || isFollowingBack
                            ? "bg-accent/10 text-accent hover:bg-accent/20"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <UserPlus className="h-3 w-3" />
                        {activePanel === "following"
                          ? t("find_unfollow")
                          : isFollowingBack
                          ? t("find_unfollow")
                          : t("find_follow")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          <Link to="/portfolio" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            <Feather className="h-4 w-4" />{t("nav_poems")}
          </Link>
          <Link to="/catalog" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            <BookOpen className="h-4 w-4" />{t("nav_catalog")}
          </Link>
          <Link to={`/author/${user.id}`} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            <Eye className="h-4 w-4" />{t("profile_public_view")}
          </Link>
        </div>

        {/* Edit profile */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Settings className="h-5 w-5 text-accent" />
              {t("profile_edit_title")}
            </h2>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                <Pencil className="h-3.5 w-3.5" />{t("profile_edit")}
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">{t("profile_display_name")}</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("profile_bio")}</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
                  className="mt-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("profile_avatar_url")}</label>
                <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..."
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {t("portfolio_cancel")}
                </button>
                <button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("profile_save")}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("profile_display_name")}</span>
                <span className="text-foreground font-medium">{nameDisplay}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">{t("auth_email")}</span>
                <span className="text-foreground font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">{t("profile_bio")}</span>
                <span className="text-foreground font-medium max-w-[60%] text-right">{(profile as any)?.bio || "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Security */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="flex w-full items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
              <Shield className="h-5 w-5 text-accent" />{t("profile_security")}
            </h2>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </button>
          {showPasswordSection && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div>
                <label className="text-sm font-medium text-foreground">{t("profile_new_password")}</label>
                <div className="relative mt-1">
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("profile_confirm_password")}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30" />
              </div>
              <button onClick={changePassword}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                {t("profile_change_password")}
              </button>
            </div>
          )}
        </div>

        {/* Sign out */}
        <div className="flex justify-center">
          <button onClick={async () => { await signOut(); navigate("/"); }}
            className="rounded-md border border-destructive/30 px-6 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            {t("nav_sign_out")}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

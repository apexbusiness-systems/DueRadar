import { useState } from "react";
import { useUser } from "@clerk/react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListWorkspaces,
  getListWorkspacesQueryKey,
  useListWorkspaceMembers,
  getListWorkspaceMembersQueryKey,
  useInviteWorkspaceMember,
  useRemoveWorkspaceMember,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, Mail, Trash2, Settings, Building2, Crown, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  owner:  { label: "Owner",  color: "text-[#F5A623]", bg: "bg-amber-500/10 border-amber-500/30", icon: Crown },
  admin:  { label: "Admin",  color: "text-[#00C8F0]",  bg: "bg-cyan-500/10 border-cyan-500/30",   icon: Shield },
  member: { label: "Member", color: "text-[#8898A8]",  bg: "bg-white/[0.04] border-white/[0.08]", icon: User },
};

export default function WorkspacePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();
  const [inviteEmail, setInviteEmail] = useState("");

  const workspacesQuery = useListWorkspaces({ query: { queryKey: getListWorkspacesQueryKey() } });
  const workspace = workspacesQuery.data?.[0];

  const membersQuery = useListWorkspaceMembers(workspaceId ?? 0, {
    query: { queryKey: getListWorkspaceMembersQueryKey(workspaceId ?? 0), enabled: !!workspaceId },
  });

  const inviteMember = useInviteWorkspaceMember();
  const removeMember = useRemoveWorkspaceMember();

  const handleInvite = () => {
    if (!workspaceId || !inviteEmail) return;
    inviteMember.mutate(
      { workspaceId, data: { email: inviteEmail, role: "member" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspaceMembersQueryKey(workspaceId) });
          toast({ title: "Invite sent" });
          setInviteEmail("");
        },
        onError: () => toast({ title: "Failed to invite", variant: "destructive" }),
      },
    );
  };

  const handleRemove = (memberId: number) => {
    if (!workspaceId || !confirm("Remove this member?")) return;
    removeMember.mutate(
      { workspaceId, memberId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkspaceMembersQueryKey(workspaceId) });
          toast({ title: "Member removed" });
        },
      },
    );
  };

  const members = Array.isArray(membersQuery.data) ? membersQuery.data : [];
  const currentUserClerkId = user?.id;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#F0F4F8] tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/[0.04] border border-white/[0.08] rounded-xl flex items-center justify-center">
              <Settings className="w-4.5 h-4.5 text-[#F5A623]" />
            </div>
            Mission Control
          </h1>
          <p className="text-[#8898A8] text-sm mt-1.5">
            Manage your organization's workspace settings and team access.
          </p>
        </div>

        {/* Workspace card */}
        <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] mb-5">
          <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.02] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F5A623]" />
            <h2 className="text-sm font-semibold text-[#F0F4F8]">Workspace Details</h2>
          </div>
          <div className="p-6">
            {workspacesQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48 bg-white/[0.05]" />
                <Skeleton className="h-4 w-32 bg-white/[0.05]" />
              </div>
            ) : workspace ? (
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-[#F5A623] font-black text-xl font-mono">
                    {(workspace.name?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#F0F4F8] text-xl" data-testid="text-workspace-name">{workspace.name}</p>
                  <p className="text-sm text-[#8898A8] font-mono mt-0.5">/{workspace.slug}</p>
                  <p className="text-xs text-[#4A5568] mt-1 font-mono">
                    Created {new Date(workspace.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[#8898A8] text-sm">No workspace found.</p>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] mb-5">
          <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F5A623]" />
              <h2 className="text-sm font-semibold text-[#F0F4F8]">Team Members</h2>
              {members.length > 0 && (
                <span className="bg-white/[0.06] border border-white/[0.08] text-[#CBD5E1] text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                  {members.length}
                </span>
              )}
            </div>
          </div>

          {/* Invite bar */}
          <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.01]">
            <p className="text-xs font-semibold text-[#8898A8] uppercase tracking-wide mb-3">Invite someone</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] placeholder:text-[#4A5568] focus-visible:ring-[#F5A623] h-10"
                data-testid="input-invite-email"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <Button
                type="button"
                onClick={handleInvite}
                disabled={!inviteEmail || inviteMember.isPending}
                className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0F0800] font-bold rounded-xl h-10 px-5 gap-2 shadow-[0_0_16px_rgba(245,166,35,0.2)] border-none flex-shrink-0"
                data-testid="button-invite"
              >
                <Mail className="w-4 h-4" />
                Invite
              </Button>
            </div>
          </div>

          {/* Member list */}
          <div>
            {membersQuery.isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/[0.05]" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-12 h-12 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-[#8898A8]" />
                </div>
                <p className="font-semibold text-[#F0F4F8] mb-1">No team members yet</p>
                <p className="text-sm text-[#8898A8]">Invite your colleagues using the form above.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {members.map((member) => {
                  const roleConf = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
                  const RoleIcon = roleConf.icon;
                  const isCurrentUser = member.clerkUserId === currentUserClerkId;
                  const initials = ((member.name ?? member.email ?? '?')[0] ?? '?').toUpperCase();

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors"
                      data-testid={`row-member-${member.id}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#F0F4F8] text-sm font-black flex-shrink-0 shadow-sm font-mono">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#F0F4F8] truncate">{member.name ?? member.email}</p>
                          {isCurrentUser && (
                            <span className="text-xs text-[#8898A8] font-medium">(you)</span>
                          )}
                        </div>
                        <p className="text-xs text-[#8898A8] truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", roleConf.bg, roleConf.color)}>
                          <RoleIcon className="w-3 h-3" />
                          {roleConf.label}
                        </span>
                        {!isCurrentUser && (
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A5568] hover:bg-red-500/15 hover:text-[#FF4040] transition-colors"
                            onClick={() => handleRemove(member.id)}
                            data-testid={`button-remove-member-${member.id}`}
                            aria-label="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Current user */}
        <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.02] flex items-center gap-2">
            <User className="w-4 h-4 text-[#F5A623]" />
            <h2 className="text-sm font-semibold text-[#F0F4F8]">Your Account</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <span className="text-sm text-[#8898A8]">Email</span>
              <span className="text-sm font-semibold text-[#F0F4F8]" data-testid="text-user-email">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
            {user?.firstName && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#8898A8]">Full name</span>
                <span className="text-sm font-semibold text-[#F0F4F8]" data-testid="text-user-name">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

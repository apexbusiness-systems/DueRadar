import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateObligation, getListObligationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useUser } from "@clerk/react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["Licensing", "Insurance", "Contracts", "Software", "HR & Compliance", "Real Estate", "Other"];

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(2000).optional(),
  category: z.string().min(1, "Category is required"),
  dueDate: z.string().min(1, "Due date is required"),
  renewalFrequency: z.string().optional(),
  ownerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  backupOwnerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().max(5000).optional(),
});
type FormValues = z.infer<typeof formSchema>;

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-obsidian-surface rounded-2xl border border-white/[0.07] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="px-6 py-4 border-b border-white/[0.07] bg-white/[0.02]">
        <h2 className="text-sm font-semibold text-[#F0F4F8]">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

export default function ObligationNewPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createObligation = useCreateObligation();
  const { workspaceId, isLoading: wsLoading, error: wsError } = useWorkspace();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      dueDate: "",
      renewalFrequency: "",
      ownerEmail: user?.emailAddresses[0]?.emailAddress ?? "",
      backupOwnerEmail: "",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!workspaceId) {
      toast({ title: "Workspace not loaded yet. Please wait.", variant: "destructive" });
      return;
    }

    createObligation.mutate(
      {
        data: {
          workspaceId,
          title: values.title,
          description: values.description || undefined,
          category: values.category,
          dueDate: values.dueDate,
          renewalFrequency: (values.renewalFrequency as "once" | "monthly" | "quarterly" | "annually" | "custom" | null) || null,
          ownerClerkId: null,
          ownerEmail: values.ownerEmail || null,
          backupOwnerClerkId: null,
          backupOwnerEmail: values.backupOwnerEmail || null,
          notes: values.notes || null,
          tags: [],
        },
      },
      {
        onSuccess: (obligation) => {
          queryClient.invalidateQueries({ queryKey: getListObligationsQueryKey() });
          toast({ title: "Obligation created" });
          setLocation(`/obligations/${obligation.id}`);
        },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      },
    );
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setLocation("/obligations")}
            className="w-9 h-9 rounded-xl bg-obsidian-surface border border-white/[0.08] flex items-center justify-center text-[#8898A8] hover:text-[#F0F4F8] hover:border-white/[0.2] transition-colors shadow-sm"
            data-testid="button-back"
            aria-label="Back to obligations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#F0F4F8] tracking-tight">New Obligation</h1>
            <p className="text-[#8898A8] text-sm mt-0.5">Track a new deadline or renewal</p>
          </div>
        </div>

        {wsError && (
          <div className="mb-6 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-[#FF4040]">
            {wsError}
          </div>
        )}

        {wsLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-60 w-full rounded-2xl bg-white/[0.05]" />
            <Skeleton className="h-40 w-full rounded-2xl bg-white/[0.05]" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormSection title="Core Details">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#CBD5E1] font-medium text-xs">Title <span className="text-[#FF4040]">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Business License Renewal"
                        className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] placeholder:text-[#4A5568] focus-visible:ring-[#F5A623] transition-colors"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#CBD5E1] font-medium text-xs">Category <span className="text-[#FF4040]">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8]" data-testid="select-category">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#0A0E18] border-white/[0.1] text-[#F0F4F8]">
                          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#CBD5E1] font-medium text-xs">Due Date <span className="text-[#FF4040]">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] focus-visible:ring-[#F5A623]"
                          {...field}
                          data-testid="input-due-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="renewalFrequency" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#CBD5E1] font-medium text-xs">Renewal Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8]" data-testid="select-frequency">
                          <SelectValue placeholder="None (one-time)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#0A0E18] border-white/[0.1] text-[#F0F4F8]">
                        <SelectItem value="once">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#CBD5E1] font-medium text-xs">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this obligation..."
                        rows={2}
                        className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] placeholder:text-[#4A5568] focus-visible:ring-[#F5A623] resize-none"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <FormSection title="Ownership">
                <p className="text-xs text-[#8898A8] -mt-1">Assign an owner and backup so reminders reach the right people.</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="ownerEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#CBD5E1] font-medium text-xs">Owner Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="owner@company.com" className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] placeholder:text-[#4A5568] focus-visible:ring-[#F5A623]" {...field} data-testid="input-owner-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="backupOwnerEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#CBD5E1] font-medium text-xs">Backup Owner</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="backup@company.com" className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] placeholder:text-[#4A5568] focus-visible:ring-[#F5A623]" {...field} data-testid="input-backup-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </FormSection>

              <FormSection title="Notes">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Any additional context, filing instructions, or notes..." rows={3} className="rounded-xl border-white/[0.08] bg-obsidian-surface text-[#F0F4F8] placeholder:text-[#4A5568] focus-visible:ring-[#F5A623] resize-none" {...field} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormSection>

              <div className="flex gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={createObligation.isPending || !workspaceId}
                  className="flex-1 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0F0800] font-bold rounded-xl h-11 shadow-[0_0_16px_rgba(245,166,35,0.2)] border-none gap-2"
                  data-testid="button-submit"
                >
                  {createObligation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Create Obligation</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/obligations")}
                  className="rounded-xl h-11 border-white/[0.08] bg-white/[0.02] text-[#CBD5E1] hover:bg-white/[0.06] hover:text-[#F0F4F8]"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </AppLayout>
  );
}

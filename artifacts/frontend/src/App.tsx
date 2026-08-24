import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { RadarMark } from "@/components/layout/AppLayout";
import LandingPage from "@/pages/landing";
import InfoDetailPage from "@/pages/info-detail";
import DashboardPage from "@/pages/dashboard";
import ObligationsPage from "@/pages/obligations";
import ObligationDetailPage from "@/pages/obligation-detail";
import ObligationNewPage from "@/pages/obligation-new";
import ImportPage from "@/pages/import";
import DeliveryPage from "@/pages/delivery";
import AuditPage from "@/pages/audit";
import WorkspacePage from "@/pages/workspace";
import NotFound from "@/pages/not-found";

import { env } from "./env";

const clerkPubKey = env.CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = env.CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/"/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/assets/app-icon.png`,
  },
  variables: {
    colorPrimary: "#F5A623",
    colorForeground: "#F0F4F8",
    colorMutedForeground: "#B7C4D6",
    colorDanger: "#FF4040",
    colorBackground: "#0A0E18",
    colorInput: "#1D2A41",
    colorInputForeground: "#F0F4F8",
    colorNeutral: "#162237",
    fontFamily: "Space Grotesk, sans-serif",
    borderRadius: "0.5625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-[440px]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-semibold text-2xl tracking-tight text-[#F8FAFC]",
    headerSubtitle: "text-sm leading-relaxed text-[#CBD5E1]",
    socialButtonsBlockButtonText: "font-medium text-[#E6EDF6]",
    formFieldLabel: "text-sm font-medium text-[#E6EDF6]",
    footerActionLink: "inline-flex min-h-11 items-center justify-center rounded-md border border-white/85 bg-white px-4 text-sm font-semibold text-[#0F172A] shadow-sm transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBA74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]",
    footerActionText: "text-[#B7C4D6]",
    dividerText: "text-xs text-[#B7C4D6]",
    identityPreviewEditButton: "",
    formFieldSuccessText: "",
    alertText: "text-[#E6EDF6]",
    logoBox: "hidden",
    logoImage: "h-8 w-auto",
    socialButtonsBlockButton: "min-h-11 transition-colors bg-[#1E293B] hover:bg-[#243754] border border-[rgba(148,163,184,0.35)] focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]",
    formButtonPrimary: "min-h-11 font-medium bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#1E293B] hover:brightness-110 active:brightness-95 focus-visible:ring-2 focus-visible:ring-[#FDBA74] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] disabled:opacity-60",
    formFieldInput: "bg-[#1D2A41] border border-[#2F3F5E] text-[#F0F4F8] placeholder:text-[#A7B5C9]",
    footerAction: "pt-4 flex items-center justify-center gap-3",
    dividerLine: "bg-[#2F3F5E]",
    alert: "rounded-lg",
    formFieldHintText: "text-xs text-[#94A3B8]",
    formFieldErrorText: "text-sm text-[#FCA5A5]",
    formFieldInputShowPasswordButton: "text-[#94A3B8] hover:text-[#E2E8F0]",
    formResendCodeLink: "text-[#F59E0B] hover:text-[#FDBA74]",
    devModeNotice: "hidden",
    developmentModeNotice: "hidden",
    badge: "hidden",
    otpCodeFieldInput: "",
    formFieldRow: "mb-4",
    main: "p-0",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 12%, rgba(245, 158, 11, 0.16), transparent 32%), radial-gradient(circle at 15% 80%, rgba(59, 130, 246, 0.10), transparent 30%), linear-gradient(180deg, #0B1220 0%, #070B12 100%)",
        }}
      />
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-[rgba(148,163,184,0.22)] bg-[rgba(15,23,42,0.86)] shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <div aria-hidden="true" className="h-1 w-full bg-gradient-to-r from-[#F59E0B] to-[#F97316]" />
        <div className="grid md:grid-cols-[1fr_440px]">
          <aside className="hidden border-r border-[rgba(148,163,184,0.16)] p-10 md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-8 flex items-center gap-2 text-lg font-semibold text-[#F8FAFC]">
                <RadarMark size={22} />
                <span>Due<span className="text-[#F59E0B]">Radar</span></span>
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-[#F8FAFC]">
                Never miss a critical business deadline again.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#CBD5E1]">
                Track renewals, filings, permits, contracts, and alerts from one secure dashboard.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-[#CBD5E1]">
                <li>• Filing and compliance reminders</li>
                <li>• Contract and renewal alerts</li>
                <li>• Business deadline visibility</li>
              </ul>
            </div>
            <p className="mt-8 text-xs text-[#94A3B8]">
              Built for owner-led teams that cannot afford missed deadlines.
            </p>
          </aside>
          <section className="p-6 sm:p-8">
            <div className="mb-5 md:hidden">
              <div className="mb-4 flex items-center gap-2 text-base font-semibold text-[#F8FAFC]">
                <RadarMark size={20} />
                <span>Due<span className="text-[#F59E0B]">Radar</span></span>
              </div>
              <h1 className="text-2xl font-semibold leading-tight text-[#F8FAFC]">
                Never miss a critical business deadline again.
              </h1>
              <p className="mt-2 text-sm text-[#CBD5E1]">
                Track renewals, filings, permits, contracts, and alerts from one secure dashboard.
              </p>
            </div>
            <SignIn
              routing="path"
              path={`${basePath}/sign-in`}
              signUpUrl={`${basePath}/sign-up`}
              fallbackRedirectUrl={`${basePath}/dashboard`}
            />
            <p className="mt-4 text-center text-xs text-[#94A3B8]">Secure sign-in. No password required.</p>
            <nav aria-label="Legal and support links" className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#CBD5E1]">
              <a className="hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] rounded-sm" href={`${basePath}/privacy`}>Privacy</a>
              <a className="hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] rounded-sm" href={`${basePath}/terms`}>Terms</a>
              <a className="hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] rounded-sm" href="mailto:support@dueradar.icu">Support</a>
              <a className="hover:text-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] rounded-sm" href={`${basePath}/security`}>Security</a>
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "#05070B" }}
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function HomeRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  // Only redirect after Clerk has fully loaded and confirmed sign-in state.
  // Rendering the landing page by default ensures it is visible in CI E2E
  // even if Clerk.js cannot be fetched (e.g. DNS failure for test keys).
  // Protected app routes remain fully guarded by ProtectedRoute below.
  if (isLoaded && isSignedIn) {
    return <Redirect to="/dashboard" />;
  }
  return (
    <LandingPage
      onEnter={() => {
        if (isSignedIn) {
          setLocation("/dashboard");
        } else {
          setLocation("/sign-in");
        }
      }}
      onViewRegister={() => {
        if (isSignedIn) {
          setLocation("/obligations");
        } else {
          setLocation("/sign-in");
        }
      }}
    />
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  if (import.meta.env.VITE_TEST_BYPASS_AUTH === "true") {
    return <Component />;
  }
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}



function AppRouter() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Manage critical deadlines, renewals, and alerts from one secure dashboard.",
          },
        },
        signUp: {
          start: { title: "Get started", subtitle: "Track your deadlines with DueRadar" },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <WorkspaceProvider>
          <TooltipProvider>
            <Switch>
              {/* Landing - no shell */}
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/info/:category" component={InfoDetailPage} />

              {/* Authenticated routes */}
              <Route path="/dashboard">
                <ProtectedRoute component={DashboardPage} />
              </Route>
              <Route path="/obligations/new">
                <ProtectedRoute component={ObligationNewPage} />
              </Route>
              <Route path="/obligations/:id">
                <ProtectedRoute component={ObligationDetailPage} />
              </Route>
              <Route path="/obligations">
                <ProtectedRoute component={ObligationsPage} />
              </Route>
              <Route path="/import">
                <ProtectedRoute component={ImportPage} />
              </Route>
              <Route path="/delivery">
                <ProtectedRoute component={DeliveryPage} />
              </Route>
              <Route path="/audit">
                <ProtectedRoute component={AuditPage} />
              </Route>
              <Route path="/workspace">
                <ProtectedRoute component={WorkspacePage} />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </TooltipProvider>
          <Toaster />
        </WorkspaceProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRouter />
    </WouterRouter>
  );
}

export default App;
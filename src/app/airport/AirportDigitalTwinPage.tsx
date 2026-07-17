import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Loader2, PanelLeftOpen } from "lucide-react";
import { Toaster, toast } from "sonner";
import { AIRPORT_MODULES, getAirportModule, type AirportModuleId } from "./config/airportRegistry";
import { AirportHeader } from "./layout/AirportHeader";
import { AirportOverview } from "./overview/AirportOverview2D";
import {
  AirportAppLauncher, AirportBottomNavigation, AirportModuleSidebar,
} from "./shared/AirportUI";
import { AirportLanguageProvider, useAirportLanguage } from "./i18n/AirportLanguage";
import "./styles/airport.css";

const AirportModuleContent = lazy(() => import("./modules/AirportModuleContent"));

const initialSections = Object.fromEntries(
  AIRPORT_MODULES.map((module) => [module.id, module.defaultSection]),
) as Record<AirportModuleId, string>;

export function AirportDigitalTwinPage() {
  return <AirportLanguageProvider><AirportDigitalTwinPageContent /></AirportLanguageProvider>;
}

function AirportDigitalTwinPageContent() {
  const { language, tr, localizeModule } = useAirportLanguage();
  const [activeModule, setActiveModule] = useState<AirportModuleId>("OVERVIEW");
  const [sections, setSections] = useState<Record<AirportModuleId, string>>(initialSections);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [spatialContext, setSpatialContext] = useState("All zones");
  const [overviewRequest, setOverviewRequest] = useState(0);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const sourceModule = useMemo(() => getAirportModule(activeModule), [activeModule]);
  const module = useMemo(() => localizeModule(sourceModule), [sourceModule, localizeModule]);
  const activeSection = sections[activeModule] ?? sourceModule.defaultSection;
  const dockedSidebar = activeModule !== "OVERVIEW";

  useEffect(() => {
    document.title = "Hospital Digital Twin";
  }, [language]);

  useEffect(() => {
    const onFullscreenChange = (event: Event) => setMapFullscreen(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener("airport-fullscreen-map-change", onFullscreenChange);
    return () => window.removeEventListener("airport-fullscreen-map-change", onFullscreenChange);
  }, []);

  const changeModule = (moduleId: AirportModuleId) => {
    setActiveModule(moduleId);
    setSidebarOpen(moduleId !== "OVERVIEW");
    toast.info(`${localizeModule(getAirportModule(moduleId)).label}`);
  };

  const changeSection = (sectionId: string) => {
    setSections((current) => ({ ...current, [activeModule]: sectionId }));
    if (activeModule === "OVERVIEW") {
      setOverviewRequest((value) => value + 1);
      setSidebarOpen(false);
    }
  };

  const launcherSelect = (moduleId: AirportModuleId, sectionId: string) => {
    setSections((current) => ({ ...current, [moduleId]: sectionId }));
    setActiveModule(moduleId);
    setSidebarOpen(moduleId !== "OVERVIEW");
    if (moduleId === "OVERVIEW") setOverviewRequest((value) => value + 1);
  };

  return (
    <div className="airport-platform relative flex h-screen min-h-[720px] flex-col overflow-hidden font-sans">
      <Toaster position="top-center" richColors theme="dark" />
      <AirportHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        spatialContext={spatialContext}
        onSpatialContextChange={setSpatialContext}
      />

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="airport-nav-toggle absolute left-3 top-3 z-[72] flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-[#06111f]/84 px-3 py-2 text-[10px] font-semibold text-cyan-200 shadow-xl backdrop-blur-xl hover:bg-cyan-400/10"
            title={tr("Show module navigation")}
          >
            <PanelLeftOpen size={15} />
            <span className="hidden 2xl:inline">{module.label}</span>
          </button>
        )}

        <AirportModuleSidebar
          module={sourceModule}
          activeSection={activeSection}
          onSectionChange={changeSection}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          docked={dockedSidebar}
        />

        <main className={activeModule === "OVERVIEW"
          ? "h-full min-w-0 flex-1 overflow-hidden"
          : activeModule === "BMS"
            ? `h-full min-w-0 flex-1 overflow-hidden px-3 pt-2 ${activeSection === "bms-hvac" ? "pb-[72px]" : ""}`
            : "airport-scrollbar h-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-4"
        }>
          {activeModule === "OVERVIEW" ? (
            <AirportOverview
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activeSection={activeSection}
              onOpenModule={changeModule}
              sectionRequest={overviewRequest}
            />
          ) : (
            <Suspense fallback={<div className="grid min-h-[520px] place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-cyan-300" /><p className="mt-3 text-xs text-slate-500">{language === "vi" ? `Đang tải ${module.label}…` : `Loading ${module.label}…`}</p></div></div>}>
              <AirportModuleContent moduleId={activeModule} sectionId={activeSection} onNavigateSection={changeSection} />
            </Suspense>
          )}
        </main>
      </div>

      {!mapFullscreen && <AirportBottomNavigation activeModule={activeModule} onModuleChange={changeModule} onLauncher={() => setLauncherOpen(true)} />}
      <AirportAppLauncher open={launcherOpen} onClose={() => setLauncherOpen(false)} onSelect={launcherSelect} />
    </div>
  );
}

export default AirportDigitalTwinPage;

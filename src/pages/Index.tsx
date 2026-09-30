import React, { useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import SoilHealthMetrics from '../components/Dashboard/SoilHealthMetrics';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Sprout, Settings, BarChart3, History, FlaskConical } from 'lucide-react';
import { useMboleaT } from '../i18n/mbolea';
import { addScrollRevealToPage } from '../utils/scrollReveal';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

const Index = () => {
  const { lang } = useLanguage();
  const t = translations[lang];
  const m = useMboleaT();
  // Initialize scroll reveal when component mounts
  useEffect(() => {
    const cleanup = addScrollRevealToPage();
    return cleanup;
  }, []);

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-card rounded-t-[20px] p-5 min-h-[calc(100vh-56px)] mt-[-12px] shadow-lg w-full max-w-full mx-auto transition-colors duration-300">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{t.welcomeToAgriOracle}</h2>
          <p className="text-base text-muted-foreground">{t.yourSmartDashboard}</p>
        </div>
        {/* Existing homepage content */}
        <div className="space-y-6 mt-8">
          <h1 className="text-3xl font-bold mb-2 reveal-on-scroll">{t.soilAnalysisDashboard}</h1>
          <p className="text-muted-foreground mb-6 reveal-on-scroll">
              {t.monitorSoilHealthMetrics}
            </p>
          {/* Mbolea Sahihi – the fertilizer planner */}
          <Link to="/mbolea" className="block rounded-[28px] p-5 text-white bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 shadow-lg shadow-green-900/20 active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <FlaskConical size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold">{m.appName}</h2>
                <p className="text-sm text-white/80">{m.tagline}</p>
              </div>
              <ArrowRight size={20} className="flex-shrink-0" />
            </div>
          </Link>
          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-animation">
            <Link to="/soil-health" className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 hover:bg-muted/10 transition-colors reveal-on-scroll">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-green-500/20 rounded-full mr-3">
                  <Leaf size={20} className="text-green-500" />
                </div>
                <h2 className="text-lg font-semibold">{t.soilHealth}</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                {t.viewDetailedSoilHealthMetrics}
              </p>
              <div className="flex justify-end">
                <ArrowRight size={18} className="text-primary" />
              </div>
            </Link>
            <Link to="/recommendations" className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 hover:bg-muted/10 transition-colors reveal-on-scroll">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-full mr-3">
                  <Sprout size={20} className="text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold">{t.cropRecommendations}</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                {t.getAIPoweredCropRecommendations}
              </p>
              <div className="flex justify-end">
                <ArrowRight size={18} className="text-primary" />
              </div>
            </Link>
            <Link to="/recent-analysis" className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 hover:bg-muted/10 transition-colors reveal-on-scroll">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-full mr-3">
                  <History size={20} className="text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold">{t.recentAnalysis.title}</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                {t.recentAnalysis.description}
              </p>
              <div className="flex justify-end">
                <ArrowRight size={18} className="text-primary" />
              </div>
            </Link>
            <Link to="/settings" className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 hover:bg-muted/10 transition-colors reveal-on-scroll">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-lime-500/20 rounded-full mr-3">
                  <Settings size={20} className="text-lime-500" />
                </div>
                <h2 className="text-lg font-semibold">{t.settings}</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                {t.configureAppSettings}
              </p>
              <div className="flex justify-end">
                <ArrowRight size={18} className="text-primary" />
            </div>
            </Link>
          </div>
          {/* Summary of Soil Health */}
          <div className="card-glass rounded-[28px] backdrop-blur-md shadow-2xl p-5 reveal-on-scroll">
            <h2 className="text-lg font-semibold mb-4">{t.soilHealthSummary}</h2>
            <div className="h-[300px] overflow-hidden">
              <SoilHealthMetrics />
            </div>
            <div className="mt-4 text-center">
              <Link to="/soil-health" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                {t.viewFullAnalysis}
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;

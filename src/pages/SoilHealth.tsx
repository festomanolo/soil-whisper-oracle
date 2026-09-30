import React, { useEffect } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import SoilHealthMetrics from '../components/Dashboard/SoilHealthMetrics';
import ESP32Connection from '../components/Dashboard/ESP32Connection';
import { addScrollRevealToPage } from '../utils/scrollReveal';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

const SoilHealth = () => {
  const { lang } = useLanguage();
  const t = translations[lang];
  // Initialize scroll reveal when component mounts
  useEffect(() => {
    const cleanup = addScrollRevealToPage();
    return cleanup;
  }, []);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-2 reveal-on-scroll">{t.soilHealthAnalysisTitle}</h1>
        <p className="text-muted-foreground mb-6 reveal-on-scroll">
          {t.soilHealthAnalysisDescription}
        </p>
        
        <div className="reveal-on-scroll">
          <SoilHealthMetrics />
        </div>
        <div className="reveal-on-scroll">
          <ESP32Connection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SoilHealth; 
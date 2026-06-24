import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    welcome: "Welcome to CourtConnect",
    dashboard: "Dashboard",
    totalCases: "Total Cases",
    activeCases: "Active Cases",
    upcomingHearings: "Upcoming Hearings",
    notifications: "Notifications",
    cases: "Cases",
    hearings: "Hearings",
    users: "Users",
    settings: "Settings",
    logout: "Logout",
    login: "Login",
    register: "Register",
    caseNumber: "Case Number",
    caseType: "Case Type",
    status: "Status",
    priority: "Priority",
    judge: "Judge",
    lawyer: "Lawyer",
    actions: "Actions",
    viewDetails: "View Details",
    fileNewCase: "File New Case",
    profile: "My Profile",
    aiAssistant: "AI Legal Assistant",
    virtualCourt: "Virtual Courtroom",
    analytics: "Analytics & Reports"
  },
  hi: {
    welcome: "कोर्टकनेक्ट में आपका स्वागत है",
    dashboard: "डैशबोर्ड",
    totalCases: "कुल मामले",
    activeCases: "सक्रिय मामले",
    upcomingHearings: "आगामी सुनवाई",
    notifications: "सूचनाएं",
    cases: "मामले",
    hearings: "सुनवाई",
    users: "उपयोगकर्ता",
    settings: "सेटिंग्स",
    logout: "लॉगआउट",
    login: "लॉगिन",
    register: "पंजीकरण",
    caseNumber: "मामला संख्या",
    caseType: "मामले का प्रकार",
    status: "स्थिति",
    priority: "प्राथमिकता",
    judge: "न्यायाधीश",
    lawyer: "वकील",
    actions: "कार्रवाई",
    viewDetails: "विवरण देखें",
    fileNewCase: "नया मामला दर्ज करें",
    profile: "मेरी प्रोफाइल",
    aiAssistant: "एआई कानूनी सहायक",
    virtualCourt: "आभासी अदालत",
    analytics: "विश्लेषण और रिपोर्ट"
  },
  te: {
    welcome: "కోర్టుకనెక్ట్‌కు స్వాగతం",
    dashboard: "డ్యాష్‌బోర్డ్",
    totalCases: "మొత్తం కేసులు",
    activeCases: "క్రియాశీల కేసులు",
    upcomingHearings: "రాబోయే విచారణలు",
    notifications: "నోటిఫికేషన్లు",
    cases: "కేసులు",
    hearings: "విచారణలు",
    users: "వినియోగదారులు",
    settings: "సెట్టింగులు",
    logout: "లాగ్ అవుట్",
    login: "లాగిన్",
    register: "నమోదు",
    caseNumber: "కేసు సంఖ్య",
    caseType: "కేసు రకం",
    status: "స్థితి",
    priority: "ప్రాధాన్యత",
    judge: "న్యాయమూర్తి",
    lawyer: "న్యాయవాది",
    actions: "చర్యలు",
    viewDetails: "వివరాలు వీక్షించండి",
    fileNewCase: "కొత్త కేసు దాఖలు చేయి",
    profile: "నా ప్రొఫైల్",
    aiAssistant: "AI లీగల్ అసిస్టెంట్",
    virtualCourt: "వర్చువల్ కోర్టు",
    analytics: "విశ్లేషణ & నివేదికలు"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

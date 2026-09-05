import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'hi';

export const TRANSLATIONS = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.cows': 'Cow Management',
    'nav.health': 'Health & Clinical',
    'nav.operations': 'Daily Operations',
    'nav.donations': 'Donations & 80G',
    'nav.visitors': 'Visitor Tours',
    'nav.finance': 'Financial ERP',
    'nav.gobarDhan': 'GOBAR-DHAN Scheme',
    'nav.ai': 'AI Intelligence',
    'nav.users': 'Staff & Roles',
    'nav.mainMenu': 'Main Menu',
    'nav.logout': 'Sign Out',
    'nav.liveMonitoring': 'Live Monitoring',
    'nav.alerts': 'Herd Alerts',

    // Dashboard Home
    'home.welcomeBack': 'Welcome back',
    'home.goodMorning': 'Good Morning',
    'home.goodAfternoon': 'Good Afternoon',
    'home.goodEvening': 'Good Evening',
    'home.heroDesc': 'All systems operational. Livestock health monitoring, feed distribution telemetry, and automated 80G receipts are synchronized.',
    'home.mobileNetActive': 'MobileNetV2 Active',
    'home.cattleTracked': '50 Cattle Tracked',
    'home.herdHealthy': 'Herd Status Healthy',
    'home.attentionPending': 'Attention Items Pending',

    // Quick Actions
    'action.registerCow': 'Register Cattle',
    'action.registerCowDesc': 'Add tag ID, breed & photo',
    'action.aiScan': 'AI Health Scan',
    'action.aiScanDesc': 'CNN computer vision scan',
    'action.clinicalCheckup': 'Clinical Checkup',
    'action.clinicalCheckupDesc': 'Log vitals & prescriptions',
    'action.recordDonation': 'Record Donation',
    'action.recordDonationDesc': 'Issue 80G tax receipt PDF',

    // Overview Cards
    'card.cowOverview': 'Cow Management (Cattle Population)',
    'card.totalCattle': 'Total Cattle',
    'card.healthy': 'Healthy',
    'card.underCare': 'Under Care',
    'card.pregnant': 'Pregnant',
    'card.lactating': 'Lactating',
    'card.rescued': 'Rescued',

    'card.healthOverview': 'Veterinary Clinical Health',
    'card.clinicalRecords': 'Clinical Records',
    'card.vaccinesDue': 'Vaccines Due',
    'card.activePregnancies': 'Active Pregnancies',
    'card.overdueVaccines': 'Overdue Vaccines',

    'card.opsOverview': 'Shelter Operations Today',
    'card.tasksPending': 'Tasks Pending',
    'card.overdueTasks': 'Overdue Tasks',
    'card.feedLogs': 'Feed Logs',
    'card.staffPresent': 'Staff Present',

    'card.donationOverview': 'Financial Donations & 80G',
    'card.totalInflow': 'Total Inflow',
    'card.thisMonth': 'This Month',
    'card.activeAdoptions': 'Active Adoptions',
    'card.registeredDonors': 'Registered Donors',

    'card.aiShowcaseTitle': 'AI Livestock Disease Intelligence',
    'card.aiShowcaseDesc': '116ms real-time image diagnostic scan • 9-Disease rule inference • Automated veterinary verification',
    'card.openAiSuite': 'Open AI Diagnostic Suite →',

    // Cattle Directory
    'cow.title': 'Cow Management',
    'cow.subtitle': 'Registered cattle directory, RFID/Ear tags, physical records & QR cards',
    'cow.searchPlaceholder': 'Search by name, Tag ID (e.g. COW-001), marks...',
    'cow.allBreeds': 'All Indian Breeds',
    'cow.allStatuses': 'All Health Statuses',
    'cow.searchBtn': 'Search',
    'cow.scanBtn': 'Scan Tag / QR',
    'cow.registerBtn': 'Register Cattle',
    'cow.fullProfile': 'Clinical Profile',
    'cow.downloadQr': 'Download',
    'cow.profile': 'Profile',
    'cow.housing': 'Housing',
    'cow.tag': 'Tag ID',
    'cow.years': 'Years',
    'cow.noCattle': 'No cattle match criteria',

    // Common
    'common.viewModule': 'View Module',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.download': 'Download',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    // AI Module
    'ai.title': 'AI Health Intelligence',
    'ai.subtitle': 'CNN image disease detection · ML vitals prediction · Behavior analysis',
    'ai.tabVitals': 'Vitals Prediction',
    'ai.tabImage': 'Image Scan',
    'ai.tabBehavior': 'Behavior Analysis',
    'ai.tabDiseases': 'Disease Database',
    'ai.uploadTitle': 'Upload Cow Photo for Disease Detection',
    'ai.dragDrop': 'Drag & drop a cow photo here, or click to select',
    'ai.fileTypes': 'JPG, PNG up to 10MB',
    'ai.clear': 'Clear',
    'ai.runScan': 'Run AI Scan',
    'ai.scanning': 'Scanning...',
    'ai.photoTips': 'Photo Tips',
    'ai.tip1': 'Clear, well-lit side or front view of the animal',
    'ai.tip2': 'For skin/udder issues, close-up of the affected area works best',
    'ai.tip3': 'Avoid blurry or low-light images',
    'ai.scanResults': 'Scan Results',
    'ai.confidence': 'Confidence',
    'ai.allPredictions': 'All Predictions',
    'ai.recommendedAction': 'Recommended Action',
    'ai.vetRequired': 'Veterinary consultation required',
    'ai.correctQuestion': 'Was this prediction correct?',
    'ai.correct': 'Correct',
    'ai.incorrect': 'Incorrect',
    'ai.feedbackThankYou': 'Thank you! Feedback logged to improve the model.',
    'ai.correctDiagnosisQuestion': 'What is the correct diagnosis?',
    'ai.submitCorrection': 'Submit Correction',
    'ai.enterHealthParams': 'Enter Health Parameters',
    'ai.temperature': 'Temperature (°F)',
    'ai.heartRate': 'Heart Rate (bpm)',
    'ai.weight': 'Weight (kg)',
    'ai.age': 'Age (years)',
    'ai.breed': 'Breed',
    'ai.symptoms': 'Symptoms',
    'ai.symptomsHint': 'comma-separated',
    'ai.milkYield': 'Milk Yield (L/day)',
    'ai.pregnant': 'Pregnant',
    'ai.predictDisease': 'Predict Disease',
    'ai.analyzing': 'Analyzing...',
    'ai.predictionResults': 'Prediction Results',
    'ai.predictedConditions': 'Predicted Conditions',
    'ai.recommendations': 'Recommendations',
    'ai.behaviorParams': 'Behavior Parameters',
    'ai.activityLevel': 'Activity Level',
    'ai.eatingPattern': 'Eating Pattern',
    'ai.rumination': 'Rumination (hours)',
    'ai.lyingTime': 'Lying Time (hours)',
    'ai.waterIntake': 'Water Intake (L)',
    'ai.socialBehavior': 'Social Behavior',
    'ai.analyzeBehavior': 'Analyze Behavior',
    'ai.diseaseKnowledgeBase': 'Disease Knowledge Base',
    'ai.fmd': 'Foot & Mouth Disease (FMD)',
    'ai.lsd': 'Lumpy Skin Disease (LSD)',
    'ai.mastitis': 'Mastitis (Udder Infection)',
    'ai.skinDisease': 'Skin Disease (Ringworm / Warts)',
    'ai.healthyCow': 'Healthy Cow',
    'ai.low': 'Low',
    'ai.normal': 'Normal',
    'ai.high': 'High',
    'ai.critical': 'Critical',
    'ai.moderate': 'Moderate',

    // Health Module
    'health.title': 'Health & Clinical Records',
    'health.subtitle': 'Veterinary checkups, vaccination schedules, pregnancy tracking & medical logs',
    'health.tabRecords': 'Clinical Records',
    'health.tabVaccines': 'Vaccinations',
    'health.tabPregnancy': 'Pregnancies',
    'health.newCheckup': 'New Clinical Checkup',
    'health.scheduleVaccine': 'Schedule Vaccine',
    'health.logPregnancy': 'Log Pregnancy',
    'health.quickAiScan': 'Quick AI Scan',

    // Operations Module
    'ops.title': 'Daily Shelter Operations',
    'ops.subtitle': 'Feed distribution, inventory tracking, task assignment & staff attendance',
    'ops.tabFeed': 'Feed Logs',
    'ops.tabTasks': 'Daily Tasks',
    'ops.tabInventory': 'Inventory & Stock',
    'ops.tabAttendance': 'Staff Attendance',
    'ops.logFeed': 'Log Feed Distribution',
    'ops.newTask': 'New Task',
    'ops.addItem': 'Add Item',

    // Donations Module
    'donations.title': 'Donations & 80G Receipts',
    'donations.subtitle': 'Donor contributions, cow adoptions & automated 80G tax certificates',
    'donations.tabAll': 'All Donations',
    'donations.tabAdoptions': 'Cow Adoptions',
    'donations.recordDonation': 'Record Donation',
    'donations.newAdoption': 'New Cow Adoption',
    'donations.downloadReceipt': '80G Receipt PDF',

    // Visitors Module
    'visitors.title': 'Visitor & Tour Management',
    'visitors.subtitle': 'Schedule gaushala tours, track pilgrim visits & collect visitor feedback',
    'visitors.bookVisit': 'Book New Visit',

    // Finance Module
    'finance.title': 'Financial ERP & Accounting',
    'finance.subtitle': 'Shelter income, operational expenses, monthly budgets & ledger',
    'finance.addExpense': 'Record Expense',

    // Users Module
    'users.title': 'Staff & Role Management',
    'users.subtitle': 'User accounts, role-based access control & permissions',
    'users.addUser': 'Add New User',

    // Auth
    'auth.welcome': 'Welcome Back',
    'auth.subtitle': 'Sign in to E-Gowshala Platform',
    'auth.demoLogins': '1-Click Demo Logins',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.signIn': 'Sign In',
    'auth.signingIn': 'Signing in...',
    'auth.noAccount': "Don't have an account?",
    'auth.createAccount': 'Create Account',
  },

  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.cows': 'गौ प्रबंधन',
    'nav.health': 'स्वास्थ्य एवं चिकित्सा',
    'nav.operations': 'दैनिक संचालन',
    'nav.donations': 'दान एवं 80G रसीद',
    'nav.visitors': 'आगंतुक एवं दर्शन',
    'nav.finance': 'वित्तीय प्रबंधन',
    'nav.gobarDhan': 'गोबर-धन योजना',
    'nav.ai': 'एआई इंटेलिजेंस',
    'nav.users': 'कर्मचारी व भूमिकाएं',
    'nav.mainMenu': 'मुख्य मेनू',
    'nav.logout': 'साइन आउट',
    'nav.liveMonitoring': 'लाइव निगरानी',
    'nav.alerts': 'अलर्ट एवं सूचनाएं',

    // Dashboard Home
    'home.welcomeBack': 'स्वागत है',
    'home.goodMorning': 'सुप्रभात',
    'home.goodAfternoon': 'शुभ दोपहर',
    'home.goodEvening': 'शुभ संध्या',
    'home.heroDesc': 'सभी प्रणालियां सक्रिय हैं। गोवंश स्वास्थ्य निगरानी, चारा वितरण और स्वचालित 80G कर छूट रसीदें अद्यतन हैं।',
    'home.mobileNetActive': 'मोबाइलनेट एआई सक्रिय',
    'home.cattleTracked': '50 गोवंश निगरानी में',
    'home.herdHealthy': 'गोवंश स्थिति स्वस्थ',
    'home.attentionPending': 'कार्रवाई आवश्यक',

    // Quick Actions
    'action.registerCow': 'गाय पंजीकृत करें',
    'action.registerCowDesc': 'टैग संख्या, नस्ल व चित्र जोड़ें',
    'action.aiScan': 'एआई रोग परीक्षण',
    'action.aiScanDesc': 'कंप्यूटर विजन रोग पहचान',
    'action.clinicalCheckup': 'चिकित्सा जांच',
    'action.clinicalCheckupDesc': 'लक्षण व दवाइयां दर्ज करें',
    'action.recordDonation': 'दान दर्ज करें',
    'action.recordDonationDesc': '80G कर रसीद पीडीएफ जारी करें',

    // Overview Cards
    'card.cowOverview': 'गौ प्रबंधन (गोवंश स्थिति)',
    'card.totalCattle': 'कुल गोवंश',
    'card.healthy': 'स्वस्थ',
    'card.underCare': 'उपचाराधीन',
    'card.pregnant': 'गर्भवती',
    'card.lactating': 'दुधारू',
    'card.rescued': 'संरक्षित / रेस्क्यू',

    'card.healthOverview': 'पशु चिकित्सा एवं स्वास्थ्य',
    'card.clinicalRecords': 'चिकित्सा रिकॉर्ड',
    'card.vaccinesDue': 'नियत टीके',
    'card.activePregnancies': 'गर्भवती गाएं',
    'card.overdueVaccines': 'अतिदेय टीके',

    'card.opsOverview': 'गौशाला दैनिक संचालन',
    'card.tasksPending': 'लंबित कार्य',
    'card.overdueTasks': 'अतिदेय कार्य',
    'card.feedLogs': 'चारा विवरण',
    'card.staffPresent': 'उपस्थित कर्मचारी',

    'card.donationOverview': 'दान एवं 80G रसीदें',
    'card.totalInflow': 'कुल दान राशि',
    'card.thisMonth': 'इस माह',
    'card.activeAdoptions': 'सक्रिय गो-गोद',
    'card.registeredDonors': 'पंजीकृत दानदाता',

    'card.aiShowcaseTitle': 'एआई गोवंश रोग निवारण प्रणाली',
    'card.aiShowcaseDesc': '116 मिलीसेकंड त्वरित चित्र जांच • 9-रोग निवारक विश्लेषण • पशु चिकित्सक सत्यापन',
    'card.openAiSuite': 'एआई जांच केंद्र खोलें →',

    // Cattle Directory
    'cow.title': 'गौ प्रबंधन',
    'cow.subtitle': 'पंजीकृत गोवंश सूची, आरएफआईडी/ईयर टैग, शारीरिक विवरण एवं स्मार्ट क्यूआर कार्ड',
    'cow.searchPlaceholder': 'नाम, टैग संख्या (उदा. COW-001) से खोजें...',
    'cow.allBreeds': 'सभी भारतीय नस्लें',
    'cow.allStatuses': 'सभी स्वास्थ्य स्थितियां',
    'cow.searchBtn': 'खोजें',
    'cow.scanBtn': 'टैग / क्यूआर स्कैन करें',
    'cow.registerBtn': 'नया गोवंश जोड़ें',
    'cow.fullProfile': 'सम्पूर्ण विवरण',
    'cow.downloadQr': 'डाउनलोड',
    'cow.profile': 'प्रोफ़ाइल',
    'cow.housing': 'शेड / आवास',
    'cow.tag': 'टैग संख्या',
    'cow.years': 'वर्ष',
    'cow.noCattle': 'कोई गोवंश नहीं मिला',

    // Common
    'common.viewModule': 'विवरण देखें',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.download': 'डाउनलोड',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.loading': 'लोड हो रहा है...',

    // AI Module
    'ai.title': 'एआई स्वास्थ्य विश्लेषण',
    'ai.subtitle': 'सीएनएन छवि रोग पहचान • एमएल वाइटल्स भविष्यवाणी • व्यवहार विश्लेषण',
    'ai.tabVitals': 'वाइटल्स भविष्यवाणी',
    'ai.tabImage': 'छवि स्कैन',
    'ai.tabBehavior': 'व्यवहार विश्लेषण',
    'ai.tabDiseases': 'रोग डेटाबेस',
    'ai.uploadTitle': 'रोग पहचान के लिए गाय की फोटो अपलोड करें',
    'ai.dragDrop': 'यहाँ फोटो खींच कर लाएं या चुनने के लिए क्लिक करें',
    'ai.fileTypes': 'JPG, PNG 10MB तक',
    'ai.clear': 'हटाएं',
    'ai.runScan': 'एआई स्कैन करें',
    'ai.scanning': 'स्कैन हो रहा है...',
    'ai.photoTips': 'फोटो सुझाव',
    'ai.tip1': 'पशु की स्पष्ट, अच्छी रोशनी वाली सामने या बगल की फोटो',
    'ai.tip2': 'त्वचा या थन की समस्याओं के लिए प्रभावित हिस्से की निकट फोटो लें',
    'ai.tip3': 'धुंधली या कम रोशनी वाली छवियों से बचें',
    'ai.scanResults': 'स्कैन परिणाम',
    'ai.confidence': 'सटीकता',
    'ai.allPredictions': 'सभी भविष्यवाणियां',
    'ai.recommendedAction': 'सुझावित उपचार',
    'ai.vetRequired': 'पशु चिकित्सक परामर्श आवश्यक',
    'ai.correctQuestion': 'क्या यह भविष्यवाणी सही थी?',
    'ai.correct': 'सही',
    'ai.incorrect': 'गलत',
    'ai.feedbackThankYou': 'धन्यवाद! मॉडल सुधार के लिए फीडबैक दर्ज किया गया।',
    'ai.correctDiagnosisQuestion': 'सही निदान क्या है?',
    'ai.submitCorrection': 'सुधार दर्ज करें',
    'ai.enterHealthParams': 'स्वास्थ्य पैरामीटर दर्ज करें',
    'ai.temperature': 'तापमान (°F)',
    'ai.heartRate': 'हृदय गति (bpm)',
    'ai.weight': 'वजन (किग्रा)',
    'ai.age': 'उम्र (वर्ष)',
    'ai.breed': 'नस्ल',
    'ai.symptoms': 'लक्षण',
    'ai.symptomsHint': 'अल्पविराम से अलग',
    'ai.milkYield': 'दूध उत्पादन (लीटर/दिन)',
    'ai.pregnant': 'गर्भवती',
    'ai.predictDisease': 'रोग की भविष्यवाणी करें',
    'ai.analyzing': 'विश्लेषण हो रहा है...',
    'ai.predictionResults': 'भविष्यवाणी परिणाम',
    'ai.predictedConditions': 'अनुमानित रोग',
    'ai.recommendations': 'सिफारिशें',
    'ai.behaviorParams': 'व्यवहार पैरामीटर',
    'ai.activityLevel': 'गतिविधि स्तर',
    'ai.eatingPattern': 'खान-पान का तरीका',
    'ai.rumination': 'जुगाली (घंटे)',
    'ai.lyingTime': 'बैठने का समय (घंटे)',
    'ai.waterIntake': 'पानी का सेवन (लीटर)',
    'ai.socialBehavior': 'सामाजिक व्यवहार',
    'ai.analyzeBehavior': 'व्यवहार का विश्लेषण करें',
    'ai.diseaseKnowledgeBase': 'रोग ज्ञानकोष',
    'ai.fmd': 'खुरपका-मुंहपका रोग (FMD)',
    'ai.lsd': 'लम्पी स्किन रोग (LSD)',
    'ai.mastitis': 'थनैला रोग (थन संक्रमण)',
    'ai.skinDisease': 'त्वचा रोग (दाद / मस्से)',
    'ai.healthyCow': 'स्वस्थ गोवंश',
    'ai.low': 'कम',
    'ai.normal': 'सामान्य',
    'ai.high': 'अधिक',
    'ai.critical': 'गंभीर',
    'ai.moderate': 'मध्यम',

    // Health Module
    'health.title': 'स्वास्थ्य एवं चिकित्सा रिकॉर्ड',
    'health.subtitle': 'पशु चिकित्सा जांच, टीकाकरण अनुसूची, गर्भावस्था और चिकित्सा रिकॉर्ड',
    'health.tabRecords': 'चिकित्सा रिकॉर्ड',
    'health.tabVaccines': 'टीकाकरण',
    'health.tabPregnancy': 'गर्भावस्था',
    'health.newCheckup': 'नई चिकित्सा जांच',
    'health.scheduleVaccine': 'टीकाकरण शेड्यूल करें',
    'health.logPregnancy': 'गर्भावस्था दर्ज करें',
    'health.quickAiScan': 'त्वरित एआई स्कैन',

    // Operations Module
    'ops.title': 'दैनिक गौशाला संचालन',
    'ops.subtitle': 'चारा वितरण, भंडार प्रबंधन, कार्य आवंटन एवं कर्मचारी उपस्थिति',
    'ops.tabFeed': 'चारा विवरण',
    'ops.tabTasks': 'दैनिक कार्य',
    'ops.tabInventory': 'भंडार एवं स्टॉक',
    'ops.tabAttendance': 'कर्मचारी उपस्थिति',
    'ops.logFeed': 'चारा वितरण दर्ज करें',
    'ops.newTask': 'नया कार्य',
    'ops.addItem': 'नया सामान जोड़ें',

    // Donations Module
    'donations.title': 'दान एवं 80G कर रसीद',
    'donations.subtitle': 'दानदाता योगदान, गो-गोद और स्वचालित 80G कर प्रमाणपत्र प्रबंधन',
    'donations.tabAll': 'सभी दान',
    'donations.tabAdoptions': 'गो-गोद सेवा',
    'donations.recordDonation': 'दान दर्ज करें',
    'donations.newAdoption': 'नई गो-गोद दर्ज करें',
    'donations.downloadReceipt': '80G रसीद पीडीएफ',

    // Visitors Module
    'visitors.title': 'आगंतुक एवं दर्शन प्रबंधन',
    'visitors.subtitle': 'गौशाला दर्शन, श्रद्धालु भ्रमण एवं फीडबैक प्रबंधन',
    'visitors.bookVisit': 'नया दर्शन बुक करें',

    // Finance Module
    'finance.title': 'वित्तीय लेखा-जोखा एवं बजट',
    'finance.subtitle': 'गौशाला आय, परिचालन व्यय, मासिक बजट एवं बहीखाता',
    'finance.addExpense': 'नया खर्च दर्ज करें',

    // Users Module
    'users.title': 'कर्मचारी एवं भूमिका प्रबंधन',
    'users.subtitle': 'उपयोगकर्ता खाते, भूमिका आधारित अधिकार एवं अनुमतियां',
    'users.addUser': 'नया कर्मचारी जोड़ें',

    // Auth
    'auth.welcome': 'स्वागत है',
    'auth.subtitle': 'ई-गौशाला मंच में प्रवेश करें',
    'auth.demoLogins': '1-क्लिक डेमो लॉगिन',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.signIn': 'साइन इन करें',
    'auth.signingIn': 'साइन इन हो रहा है...',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.createAccount': 'नया खाता बनाएं',
  },
};

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof TRANSLATIONS.en | (string & {}), fallback?: string) => string;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang: Language) => set({ language: lang }),
      toggleLanguage: () => set((state) => ({ language: state.language === 'en' ? 'hi' : 'en' })),
      t: (key: keyof typeof TRANSLATIONS.en | (string & {}), fallback?: string) => {
        const lang = get().language;
        return (
          TRANSLATIONS[lang]?.[key as keyof typeof TRANSLATIONS.en] ||
          TRANSLATIONS.en[key as keyof typeof TRANSLATIONS.en] ||
          fallback ||
          key
        );
      },
    }),
    { name: 'egowshala-language' }
  )
);

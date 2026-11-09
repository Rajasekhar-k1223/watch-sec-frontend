/**
 * Monitorix Sovereign Enterprise — Country-Based Multi-Language Translation Engine
 * 100% Self-Contained, Air-Gapped Ready (Zero External Cloud Translation APIs)
 */

export interface CountryLanguageOption {
    countryCode: string;
    countryName: string;
    flag: string;
    languageCode: string;
    languageName: string;
    nativeName: string;
    googleCode: string;
    direction: 'ltr' | 'rtl';
    regulatoryScope: string;
}

export const SUPPORTED_COUNTRIES: CountryLanguageOption[] = [
    { countryCode: 'US', countryName: 'United States', flag: '🇺🇸', languageCode: 'en-US', languageName: 'English', nativeName: 'English', googleCode: 'en', direction: 'ltr', regulatoryScope: 'NIST / HIPAA / SOC 2' },
    { countryCode: 'ES', countryName: 'Spain / Latin America', flag: '🇪🇸', languageCode: 'es-ES', languageName: 'Spanish', nativeName: 'Español', googleCode: 'es', direction: 'ltr', regulatoryScope: 'EU GDPR / ENS' },
    { countryCode: 'IN', countryName: 'India', flag: '🇮🇳', languageCode: 'hi-IN', languageName: 'Hindi', nativeName: 'हिन्दी', googleCode: 'hi', direction: 'ltr', regulatoryScope: 'DPDP Act 2023 / RBI' },
    { countryCode: 'FR', countryName: 'France', flag: '🇫🇷', languageCode: 'fr-FR', languageName: 'French', nativeName: 'Français', googleCode: 'fr', direction: 'ltr', regulatoryScope: 'EU GDPR / CNIL' },
    { countryCode: 'DE', countryName: 'Germany', flag: '🇩🇪', languageCode: 'de-DE', languageName: 'German', nativeName: 'Deutsch', googleCode: 'de', direction: 'ltr', regulatoryScope: 'EU GDPR / BSI' },
    { countryCode: 'SA', countryName: 'Saudi Arabia / UAE', flag: '🇸🇦', languageCode: 'ar-SA', languageName: 'Arabic', nativeName: 'العربية', googleCode: 'ar', direction: 'rtl', regulatoryScope: 'Saudi NCA / NESA' },
    { countryCode: 'CN', countryName: 'China', flag: '🇨🇳', languageCode: 'zh-CN', languageName: 'Chinese', nativeName: '简体中文', googleCode: 'zh-CN', direction: 'ltr', regulatoryScope: 'PIPL / CSL' },
    { countryCode: 'JP', countryName: 'Japan', flag: '🇯🇵', languageCode: 'ja-JP', languageName: 'Japanese', nativeName: '日本語', googleCode: 'ja', direction: 'ltr', regulatoryScope: 'Japan APPI' },
    { countryCode: 'BR', countryName: 'Brazil', flag: '🇧🇷', languageCode: 'pt-BR', languageName: 'Portuguese', nativeName: 'Português', googleCode: 'pt', direction: 'ltr', regulatoryScope: 'Brazil LGPD' },
    { countryCode: 'RU', countryName: 'Russia', flag: '🇷🇺', languageCode: 'ru-RU', languageName: 'Russian', nativeName: 'Русский', googleCode: 'ru', direction: 'ltr', regulatoryScope: 'FZ-152' },
    { countryCode: 'IT', countryName: 'Italy', flag: '🇮🇹', languageCode: 'it-IT', languageName: 'Italian', nativeName: 'Italiano', googleCode: 'it', direction: 'ltr', regulatoryScope: 'EU GDPR' },
    { countryCode: 'KR', countryName: 'South Korea', flag: '🇰🇷', languageCode: 'ko-KR', languageName: 'Korean', nativeName: '한국어', googleCode: 'ko', direction: 'ltr', regulatoryScope: 'Korea PIPA' },
    { countryCode: 'NL', countryName: 'Netherlands', flag: '🇳🇱', languageCode: 'nl-NL', languageName: 'Dutch', nativeName: 'Nederlands', googleCode: 'nl', direction: 'ltr', regulatoryScope: 'EU GDPR' },
    { countryCode: 'TR', countryName: 'Turkey', flag: '🇹🇷', languageCode: 'tr-TR', languageName: 'Turkish', nativeName: 'Türkçe', googleCode: 'tr', direction: 'ltr', regulatoryScope: 'Turkey KVKK' },
];

export type TranslationKey = 
    | 'nav_command_center'
    | 'nav_asset_infrastructure'
    | 'nav_intelligence_research'
    | 'nav_administration'
    | 'nav_saas_commercial'
    | 'nav_compliance'
    | 'nav_data_loss'
    | 'nav_soc'
    | 'nav_queue'
    | 'nav_dashboard'
    | 'nav_central_server'
    | 'nav_active_agents'
    | 'nav_incidents'
    | 'nav_alerts'
    | 'nav_vulnerabilities'
    | 'nav_fleet_map'
    | 'nav_threat_hunting'
    | 'nav_sandbox'
    | 'nav_easm'
    | 'nav_waap'
    | 'nav_dlp'
    | 'nav_policies'
    | 'nav_reports'
    | 'nav_settings'
    | 'nav_sign_out'
    | 'hdr_search_placeholder'
    | 'hdr_inbound_traffic'
    | 'hdr_active_connections'
    | 'hdr_live_attack'
    | 'hdr_monitored'
    | 'hdr_status_operational'
    | 'hdr_dark_mode'
    | 'hdr_notifications'
    | 'hdr_country_language'
    | 'kpi_total_endpoints'
    | 'kpi_critical_threats'
    | 'kpi_compliance_score'
    | 'kpi_mean_time_contain'
    | 'lbl_sovereign_node'
    | 'lbl_air_gapped_verified'
    | 'lbl_zero_mock_data'
    | 'lbl_quick_isolate'
    | 'lbl_view_details';

export const TRANSLATIONS: Record<string, Record<TranslationKey, string>> = {
    'en-US': {
        nav_command_center: 'COMMAND CENTER',
        nav_asset_infrastructure: 'ASSET & INFRASTRUCTURE',
        nav_intelligence_research: 'INTELLIGENCE & RESEARCH',
        nav_administration: 'ADMINISTRATION',
        nav_saas_commercial: 'COMMERCIAL & MDR',
        nav_compliance: 'Global Compliance Center',
        nav_data_loss: 'Data Loss & Ingestion Health',
        nav_soc: 'SOC Command Center',
        nav_queue: 'Analyst Work Queue',
        nav_dashboard: 'Dashboard',
        nav_central_server: 'Central Server',
        nav_active_agents: 'Active Agents',
        nav_incidents: 'Incidents',
        nav_alerts: 'Detection Alerts',
        nav_vulnerabilities: 'Vulnerabilities',
        nav_fleet_map: 'Fleet Location Map',
        nav_threat_hunting: 'Threat Hunting Lab',
        nav_sandbox: 'Detonation Sandbox',
        nav_easm: 'External Attack Surface',
        nav_waap: 'Web & API Security (WAAP)',
        nav_dlp: 'Data Loss Prevention (DLP)',
        nav_policies: 'Security Policies',
        nav_reports: 'Audit Reports',
        nav_settings: 'Settings',
        nav_sign_out: 'Sign Out',
        hdr_search_placeholder: 'Search endpoints, threats, incidents... (Ctrl+K)',
        hdr_inbound_traffic: 'Inbound Traffic',
        hdr_active_connections: 'Active Connections',
        hdr_live_attack: 'Live Attack',
        hdr_monitored: 'Monitored',
        hdr_status_operational: 'All Systems Operational',
        hdr_dark_mode: 'Toggle Theme',
        hdr_notifications: 'Notifications',
        hdr_country_language: 'Country / Language',
        kpi_total_endpoints: 'Total Endpoints',
        kpi_critical_threats: 'Critical Threats',
        kpi_compliance_score: 'Compliance Score',
        kpi_mean_time_contain: 'MTTR Containment',
        lbl_sovereign_node: 'Sovereign Node',
        lbl_air_gapped_verified: 'Air-Gapped Verified',
        lbl_zero_mock_data: '100% Real-Time Telemetry',
        lbl_quick_isolate: 'Quick Isolate',
        lbl_view_details: 'View Details',
    },
    'de-DE': {
        nav_command_center: 'KOMMANDOZENTRALE',
        nav_asset_infrastructure: 'INFRASTRUKTUR & ASSETS',
        nav_intelligence_research: 'BEDROHUNGSFORSCHUNG',
        nav_administration: 'VERWALTUNG',
        nav_saas_commercial: 'MDR & KOMMERZIELL',
        nav_compliance: 'Globales Compliance-Zentrum',
        nav_data_loss: 'Datenverlust & Ingestion-Status',
        nav_soc: 'SOC-Leitzentrale',
        nav_queue: 'Analysten-Warteschlange',
        nav_dashboard: 'Übersicht',
        nav_central_server: 'Zentralserver',
        nav_active_agents: 'Aktive Agenten',
        nav_incidents: 'Sicherheitsvorfälle',
        nav_alerts: 'Erkennungswarnungen',
        nav_vulnerabilities: 'Schwachstellen',
        nav_fleet_map: 'Flottenstandortkarte',
        nav_threat_hunting: 'Threat-Hunting-Labor',
        nav_sandbox: 'Detonations-Sandbox',
        nav_easm: 'Externe Angriffsfläche',
        nav_waap: 'Web & API Sicherheit (WAAP)',
        nav_dlp: 'Datenverlust-Prävention (DLP)',
        nav_policies: 'Sicherheitsrichtlinien',
        nav_reports: 'Audit-Berichte',
        nav_settings: 'Einstellungen',
        nav_sign_out: 'Abmelden',
        hdr_search_placeholder: 'Endpunkte, Bedrohungen, Vorfälle durchsuchen... (Strg+K)',
        hdr_inbound_traffic: 'Eingehender Datenverkehr',
        hdr_active_connections: 'Aktive Verbindungen',
        hdr_live_attack: 'Aktiver Angriff',
        hdr_monitored: 'Überwacht',
        hdr_status_operational: 'Alle Systeme Betriebsbereit',
        hdr_dark_mode: 'Design umschalten',
        hdr_notifications: 'Benachrichtigungen',
        hdr_country_language: 'Land / Sprache',
        kpi_total_endpoints: 'Gesamte Endpunkte',
        kpi_critical_threats: 'Kritische Bedrohungen',
        kpi_compliance_score: 'Compliance-Index',
        kpi_mean_time_contain: 'Mittlere Eindämmungszeit',
        lbl_sovereign_node: 'Souveräner Knoten',
        lbl_air_gapped_verified: 'Air-Gapped Verifiziert',
        lbl_zero_mock_data: '100% Echtzeit-Telemetrie',
        lbl_quick_isolate: 'Sofort isolieren',
        lbl_view_details: 'Details anzeigen',
    },
    'fr-FR': {
        nav_command_center: 'CENTRE DE COMMANDE',
        nav_asset_infrastructure: 'ACTIFS & INFRASTRUCTURE',
        nav_intelligence_research: 'RENSEIGNEMENT & RECHERCHE',
        nav_administration: 'ADMINISTRATION',
        nav_saas_commercial: 'COMMERCIAL & MDR',
        nav_compliance: 'Centre de Conformité Globale',
        nav_data_loss: 'Perte de Données & Ingestion',
        nav_soc: 'Centre Opérationnel SOC',
        nav_queue: "File d'attente Analyste",
        nav_dashboard: 'Tableau de bord',
        nav_central_server: 'Serveur Central',
        nav_active_agents: 'Agents Actifs',
        nav_incidents: 'Incidents',
        nav_alerts: 'Alertes de Détection',
        nav_vulnerabilities: 'Vulnérabilités',
        nav_fleet_map: 'Carte des Agents',
        nav_threat_hunting: 'Laboratoire de Cyberchasse',
        nav_sandbox: 'Bac à Sable de Détonation',
        nav_easm: "Surface d'Attaque Externe",
        nav_waap: 'Sécurité Web & API (WAAP)',
        nav_dlp: 'Prévention des Fuites (DLP)',
        nav_policies: 'Politiques de Sécurité',
        nav_reports: "Rapports d'Audit",
        nav_settings: 'Paramètres',
        nav_sign_out: 'Déconnexion',
        hdr_search_placeholder: 'Rechercher hôtes, menaces, incidents... (Ctrl+K)',
        hdr_inbound_traffic: 'Trafic Entrant',
        hdr_active_connections: 'Connexions Actives',
        hdr_live_attack: 'Attaque en Cours',
        hdr_monitored: 'Sous Surveillance',
        hdr_status_operational: 'Tous Systèmes Opérationnels',
        hdr_dark_mode: 'Changer Thème',
        hdr_notifications: 'Notifications',
        hdr_country_language: 'Pays / Langue',
        kpi_total_endpoints: 'Total des Terminaux',
        kpi_critical_threats: 'Menaces Critiques',
        kpi_compliance_score: 'Score de Conformité',
        kpi_mean_time_contain: 'Temps de Confinement',
        lbl_sovereign_node: 'Nœud Souverain',
        lbl_air_gapped_verified: 'Certifié Air-Gapped',
        lbl_zero_mock_data: 'Télémétrie 100% Temps Réel',
        lbl_quick_isolate: 'Isoler Hôte',
        lbl_view_details: 'Voir Détails',
    },
    'es-ES': {
        nav_command_center: 'CENTRO DE COMANDO',
        nav_asset_infrastructure: 'ACTIVOS E INFRAESTRUCTURA',
        nav_intelligence_research: 'INTELIGENCIA E INVESTIGACIÓN',
        nav_administration: 'ADMINISTRACIÓN',
        nav_saas_commercial: 'COMERCIAL Y MDR',
        nav_compliance: 'Centro Global de Cumplimiento',
        nav_data_loss: 'Pérdida de Datos y Telemetría',
        nav_soc: 'Centro de Mando SOC',
        nav_queue: 'Cola de Trabajo del Analista',
        nav_dashboard: 'Panel Principal',
        nav_central_server: 'Servidor Central',
        nav_active_agents: 'Agentes Activos',
        nav_incidents: 'Incidentes',
        nav_alerts: 'Alertas de Detección',
        nav_vulnerabilities: 'Vulnerabilidades',
        nav_fleet_map: 'Mapa de Flota Geoespacial',
        nav_threat_hunting: 'Laboratorio de Caza de Amenazas',
        nav_sandbox: 'Sandbox de Detonación',
        nav_easm: 'Superficie de Ataque Externa',
        nav_waap: 'Seguridad Web y API (WAAP)',
        nav_dlp: 'Prevención de Fuga de Datos (DLP)',
        nav_policies: 'Políticas de Seguridad',
        nav_reports: 'Informes de Auditoría',
        nav_settings: 'Configuración',
        nav_sign_out: 'Cerrar Sesión',
        hdr_search_placeholder: 'Buscar endpoints, amenazas, incidentes... (Ctrl+K)',
        hdr_inbound_traffic: 'Tráfico Entrante',
        hdr_active_connections: 'Conexiones Activas',
        hdr_live_attack: 'Ataque Activo',
        hdr_monitored: 'Monitoreado',
        hdr_status_operational: 'Sistemas Operativos',
        hdr_dark_mode: 'Cambiar Tema',
        hdr_notifications: 'Notificaciones',
        hdr_country_language: 'País / Idioma',
        kpi_total_endpoints: 'Total de Endpoints',
        kpi_critical_threats: 'Amenazas Críticas',
        kpi_compliance_score: 'Puntuación de Cumplimiento',
        kpi_mean_time_contain: 'Tiempo de Contención',
        lbl_sovereign_node: 'Nodo Soberano',
        lbl_air_gapped_verified: 'Aislamiento Verificado',
        lbl_zero_mock_data: 'Telemetría 100% en Tiempo Real',
        lbl_quick_isolate: 'Aislar Equipo',
        lbl_view_details: 'Ver Detalles',
    },
    'ar-SA': {
        nav_command_center: 'مركز القيادة والتحكم',
        nav_asset_infrastructure: 'الأصول والبنية التحتية',
        nav_intelligence_research: 'استخبارات وبحوث التهديدات',
        nav_administration: 'الإدارة والتحكم',
        nav_saas_commercial: 'العمليات المدارة والأعمال',
        nav_compliance: 'مركز الامتثال والرقابة العالمية',
        nav_data_loss: 'سلامة تدفق البيانات ومنع التسريب',
        nav_soc: 'غرفة عمليات الأمن السيبراني (SOC)',
        nav_queue: 'قائمة مهام المحلل',
        nav_dashboard: 'لوحة التحكم المركزية',
        nav_central_server: 'الخادم الرئيسي',
        nav_active_agents: 'الوكلاء النشطون',
        nav_incidents: 'الحوادث السيبرانية',
        nav_alerts: 'تنبيهات الاكتشاف',
        nav_vulnerabilities: 'الثغرات الأمنية',
        nav_fleet_map: 'خريطة انتشار الوكلاء الجغرافية',
        nav_threat_hunting: 'مختبر تعقب التهديدات',
        nav_sandbox: 'بيئة عزل وتحليل البرمجيات الخبيثة',
        nav_easm: 'محيط الهجوم الخارجي',
        nav_waap: 'حماية الويب وواجهات البرمجة (WAAP)',
        nav_dlp: 'منع تسريب البيانات الحساسة (DLP)',
        nav_policies: 'سياسات الأمان السيبراني',
        nav_reports: 'تقارير الامتثال والتدقيق',
        nav_settings: 'الإعدادات المتقدمة',
        nav_sign_out: 'تسجيل الخروج',
        hdr_search_placeholder: 'بحث في الأجهزة والتهديدات والحوادث... (Ctrl+K)',
        hdr_inbound_traffic: 'حركة البيانات الواردة',
        hdr_active_connections: 'الاتصالات النشطة',
        hdr_live_attack: 'هجوم نشط',
        hdr_monitored: 'قيد المراقبة',
        hdr_status_operational: 'جميع الأنظمة تعمل بكفاءة',
        hdr_dark_mode: 'تبديل المظهر',
        hdr_notifications: 'الإشعارات',
        hdr_country_language: 'الدولة / اللغة',
        kpi_total_endpoints: 'إجمالي الأجهزة المحمية',
        kpi_critical_threats: 'التهديدات الحرجة',
        kpi_compliance_score: 'مؤشر الامتثال التنظيمي',
        kpi_mean_time_contain: 'متوسط سرعة الاحتواء',
        lbl_sovereign_node: 'عقدة سيادية معزولة',
        lbl_air_gapped_verified: 'معتمد للشبكات المعزولة',
        lbl_zero_mock_data: 'بيانات حية 100% في الوقت الفعلي',
        lbl_quick_isolate: 'عزل فوري',
        lbl_view_details: 'عرض التفاصيل',
    },
    'hi-IN': {
        nav_command_center: 'कमांड सेंटर',
        nav_asset_infrastructure: 'एसेट और बुनियादी ढांचा',
        nav_intelligence_research: 'खुफिया और सुरक्षा अनुसंधान',
        nav_administration: 'प्रशासन',
        nav_saas_commercial: 'वाणिज्यिक और एमडीआर',
        nav_compliance: 'वैश्विक अनुपालन केंद्र (DPDP)',
        nav_data_loss: 'डेटा हानि और अंतर्ग्रहण स्वास्थ्य',
        nav_soc: 'एसओसी कमांड सेंटर',
        nav_queue: 'विश्लेषक कार्य कतार',
        nav_dashboard: 'डैशबोर्ड',
        nav_central_server: 'केंद्रीय सर्वर',
        nav_active_agents: 'सक्रिय एजेंट',
        nav_incidents: 'सुरक्षा घटनाएं',
        nav_alerts: 'पहचान चेतावनियां',
        nav_vulnerabilities: 'सुरक्षा कमजोरियां',
        nav_fleet_map: 'फ्लीट लोकेशन मैप',
        nav_threat_hunting: 'थ्रेट हंटिंग लैब',
        nav_sandbox: 'डेटोनेशन सैंडबॉक्स',
        nav_easm: 'बाहरी हमला सतह (EASM)',
        nav_waap: 'वेब और एपीआई सुरक्षा (WAAP)',
        nav_dlp: 'डेटा हानि रोकथाम (DLP)',
        nav_policies: 'सुरक्षा नीतियां',
        nav_reports: 'ऑडिट रिपोर्ट',
        nav_settings: 'सेटिंग्स',
        nav_sign_out: 'साइन आउट',
        hdr_search_placeholder: 'एंडपॉइंट, खतरे, घटनाएं खोजें... (Ctrl+K)',
        hdr_inbound_traffic: 'इनबाउंड ट्रैफिक',
        hdr_active_connections: 'सक्रिय कनेक्शन',
        hdr_live_attack: 'लाइव हमला',
        hdr_monitored: 'निगरानी में',
        hdr_status_operational: 'सभी प्रणालियां सामान्य रूप से संचालित',
        hdr_dark_mode: 'थीम बदलें',
        hdr_notifications: 'सूचनाएं',
        hdr_country_language: 'देश / भाषा',
        kpi_total_endpoints: 'कुल एंडपॉइंट्स',
        kpi_critical_threats: 'गंभीर खतरे',
        kpi_compliance_score: 'अनुपालन स्कोर',
        kpi_mean_time_contain: 'औसत नियंत्रण समय',
        lbl_sovereign_node: 'संप्रभु नोड',
        lbl_air_gapped_verified: 'एयर-गैप्ड सत्यापित',
        lbl_zero_mock_data: '100% रीयल-टाइम डेटा',
        lbl_quick_isolate: 'तुरंत अलग करें',
        lbl_view_details: 'विवरण देखें',
    },
    'pt-BR': {
        nav_command_center: 'CENTRO DE COMANDO',
        nav_asset_infrastructure: 'ATIVOS & INFRAESTRUTURA',
        nav_intelligence_research: 'INTELIGÊNCIA & PESQUISA',
        nav_administration: 'ADMINISTRAÇÃO',
        nav_saas_commercial: 'COMERCIAL & MDR',
        nav_compliance: 'Centro Global de Conformidade (LGPD)',
        nav_data_loss: 'Perda de Dados & Saúde de Ingestão',
        nav_soc: 'Centro de Operações SOC',
        nav_queue: 'Fila de Trabalho do Analista',
        nav_dashboard: 'Painel Geral',
        nav_central_server: 'Servidor Central',
        nav_active_agents: 'Agentes Ativos',
        nav_incidents: 'Incidentes',
        nav_alerts: 'Alertas de Detecção',
        nav_vulnerabilities: 'Vulnerabilidades',
        nav_fleet_map: 'Mapa de Frota Geoespacial',
        nav_threat_hunting: 'Laboratório de Caça a Ameaças',
        nav_sandbox: 'Sandbox de Detonação',
        nav_easm: 'Superfície de Ataque Externa',
        nav_waap: 'Segurança Web e API (WAAP)',
        nav_dlp: 'Prevenção de Fuga de Dados (DLP)',
        nav_policies: 'Políticas de Segurança',
        nav_reports: 'Relatórios de Auditoria',
        nav_settings: 'Configurações',
        nav_sign_out: 'Sair',
        hdr_search_placeholder: 'Buscar endpoints, ameaças, incidentes... (Ctrl+K)',
        hdr_inbound_traffic: 'Tráfego de Entrada',
        hdr_active_connections: 'Conexões Ativas',
        hdr_live_attack: 'Ataque em Curso',
        hdr_monitored: 'Monitorado',
        hdr_status_operational: 'Todos os Sistemas Operacionais',
        hdr_dark_mode: 'Alternar Tema',
        hdr_notifications: 'Notificações',
        hdr_country_language: 'País / Idioma',
        kpi_total_endpoints: 'Total de Endpoints',
        kpi_critical_threats: 'Ameaças Críticas',
        kpi_compliance_score: 'Índice de Conformidade',
        kpi_mean_time_contain: 'Tempo Médio de Contenção',
        lbl_sovereign_node: 'Nó Soberano',
        lbl_air_gapped_verified: 'Atestado Air-Gapped',
        lbl_zero_mock_data: 'Telemetria 100% em Tempo Real',
        lbl_quick_isolate: 'Isolamento Rápido',
        lbl_view_details: 'Ver Detalhes',
    },
    'ja-JP': {
        nav_command_center: 'コマンドセンター',
        nav_asset_infrastructure: '資産＆インフラストラクチャ',
        nav_intelligence_research: '脅威インテリジェンス＆調査',
        nav_administration: 'システム管理',
        nav_saas_commercial: '商用＆MDR運用',
        nav_compliance: 'グローバルコンプライアンスセンター',
        nav_data_loss: 'データ損失＆取り込み健全性',
        nav_soc: 'SOCオペレーションセンター',
        nav_queue: 'アナリスト対応キュー',
        nav_dashboard: 'ダッシュボード',
        nav_central_server: '中央統合サーバー',
        nav_active_agents: 'アクティブエージェント',
        nav_incidents: 'セキュリティインシデント',
        nav_alerts: '検知アラート',
        nav_vulnerabilities: '脆弱性一覧',
        nav_fleet_map: '端末位置情報マップ',
        nav_threat_hunting: '脅威ハンティングラボ',
        nav_sandbox: '起爆解析サンドボックス',
        nav_easm: '外部攻撃対象領域 (EASM)',
        nav_waap: 'Web＆API保護 (WAAP)',
        nav_dlp: '情報漏洩防止 (DLP)',
        nav_policies: 'セキュリティポリシー',
        nav_reports: '監査レポート',
        nav_settings: 'システム設定',
        nav_sign_out: 'サインアウト',
        hdr_search_placeholder: '端末、脅威、インシデントを検索... (Ctrl+K)',
        hdr_inbound_traffic: '受信トラフィック',
        hdr_active_connections: 'アクティブ接続',
        hdr_live_attack: '攻撃検知中',
        hdr_monitored: '監視中',
        hdr_status_operational: '全システム正常稼働中',
        hdr_dark_mode: 'テーマ切替',
        hdr_notifications: '通知',
        hdr_country_language: '国 / 言語設定',
        kpi_total_endpoints: '監視端末総数',
        kpi_critical_threats: '深刻な脅威',
        kpi_compliance_score: '適合率スコア',
        kpi_mean_time_contain: '封じ込め時間 (MTTR)',
        lbl_sovereign_node: '主権専用ノード',
        lbl_air_gapped_verified: '閉域網 (Air-Gapped) 検証済',
        lbl_zero_mock_data: '100% リアルタイム実データ',
        lbl_quick_isolate: '即時端末隔離',
        lbl_view_details: '詳細を確認',
    },
    'zh-CN': {
        nav_command_center: '指挥控制中心',
        nav_asset_infrastructure: '数字资产与基础设施',
        nav_intelligence_research: '威胁情报与安全研究',
        nav_administration: '系统与组织管理',
        nav_saas_commercial: '商业服务与MDR',
        nav_compliance: '全球合规监管中心',
        nav_data_loss: '数据防泄露与摄入健康',
        nav_soc: 'SOC安全运营中心',
        nav_queue: '安全分析师工单队列',
        nav_dashboard: '综合态势面板',
        nav_central_server: '主控枢纽服务器',
        nav_active_agents: '在线保护端点',
        nav_incidents: '安全事件响应',
        nav_alerts: '实时告警日志',
        nav_vulnerabilities: '漏洞全景资产',
        nav_fleet_map: '终端地理分布追踪',
        nav_threat_hunting: '主动威胁猎捕实验室',
        nav_sandbox: '恶意文件起爆沙箱',
        nav_easm: '外部攻击暴露面 (EASM)',
        nav_waap: 'Web与API综合防护 (WAAP)',
        nav_dlp: '数据防丢失与泄露 (DLP)',
        nav_policies: '安全基线与策略',
        nav_reports: '合规审计报告',
        nav_settings: '平台系统配置',
        nav_sign_out: '退出登录',
        hdr_search_placeholder: '全局检索端点、威胁事件、工单... (Ctrl+K)',
        hdr_inbound_traffic: '入口总流量',
        hdr_active_connections: '活跃会话连接',
        hdr_live_attack: '拦截攻击中',
        hdr_monitored: '受控受护',
        hdr_status_operational: '所有系统运行正常',
        hdr_dark_mode: '界面主题切换',
        hdr_notifications: '告警消息',
        hdr_country_language: '国家 / 语言设定',
        kpi_total_endpoints: '受控终端总计',
        kpi_critical_threats: '严重威胁警报',
        kpi_compliance_score: '法规合规指数',
        kpi_mean_time_contain: '平均处置时间 (MTTR)',
        lbl_sovereign_node: '主权独立节点',
        lbl_air_gapped_verified: '物理隔离网络验证',
        lbl_zero_mock_data: '100% 实时原生遥测',
        lbl_quick_isolate: '一键隔离端点',
        lbl_view_details: '查看详情',
    },
    'ko-KR': {
        nav_command_center: '통합 지휘 통제 센터',
        nav_asset_infrastructure: '자산 및 인프라 보안',
        nav_intelligence_research: '위협 인텔리전스 및 연구',
        nav_administration: '시스템 관리 및 설정',
        nav_saas_commercial: 'MDR 및 서비스 관제',
        nav_compliance: '글로벌 규제 준수 센터 (PIPA)',
        nav_data_loss: '데이터 유출 방지 및 수집 모니터링',
        nav_soc: 'SOC 보안관제 센터',
        nav_queue: '보안 분석가 작업 대기열',
        nav_dashboard: '종합 대시보드',
        nav_central_server: '중앙 통제 서버',
        nav_active_agents: '활성 에이전트',
        nav_incidents: '보안 침해 사고',
        nav_alerts: '위협 탐지 알림',
        nav_vulnerabilities: '취약점 관리',
        nav_fleet_map: '에이전트 위치 지도',
        nav_threat_hunting: '위협 헌팅 연구소',
        nav_sandbox: '악성코드 분석 샌드박스',
        nav_easm: '외부 공격 표면 관리 (EASM)',
        nav_waap: '웹 및 API 보안 (WAAP)',
        nav_dlp: '데이터 유출 방지 (DLP)',
        nav_policies: '보안 정책',
        nav_reports: '감사 및 준수 보고서',
        nav_settings: '환경 설정',
        nav_sign_out: '로그아웃',
        hdr_search_placeholder: '엔드포인트, 위협, 사고 검색... (Ctrl+K)',
        hdr_inbound_traffic: '인바운드 트래픽',
        hdr_active_connections: '활성 연결 수',
        hdr_live_attack: '공격 차단 중',
        hdr_monitored: '모니터링 중',
        hdr_status_operational: '모든 시스템 정상 가동',
        hdr_dark_mode: '테마 변경',
        hdr_notifications: '알림',
        hdr_country_language: '국가 / 언어 설정',
        kpi_total_endpoints: '총 엔드포인트',
        kpi_critical_threats: '심각한 위협',
        kpi_compliance_score: '규정 준수 점수',
        kpi_mean_time_contain: '평균 격리 대응 시간',
        lbl_sovereign_node: '소버린 독립 노드',
        lbl_air_gapped_verified: '폐쇄망(Air-Gapped) 검증 완료',
        lbl_zero_mock_data: '100% 실시간 원격 원천 데이터',
        lbl_quick_isolate: '즉시 단말 격리',
        lbl_view_details: '상세 보기',
    },
    'it-IT': {
        nav_command_center: 'CENTRO DI COMANDO',
        nav_asset_infrastructure: 'RISORSE & INFRASTRUTTURA',
        nav_intelligence_research: 'INTELLIGENCE & RICERCA',
        nav_administration: 'AMMINISTRAZIONE',
        nav_saas_commercial: 'COMMERCIALE & MDR',
        nav_compliance: 'Centro di Conformità Globale (GDPR)',
        nav_data_loss: 'Perdita Dati & Flusso Telemetria',
        nav_soc: 'Centro Operativo SOC',
        nav_queue: 'Coda di Lavoro Analista',
        nav_dashboard: 'Pannello di Controllo',
        nav_central_server: 'Server Centrale',
        nav_active_agents: 'Agenti Attivi',
        nav_incidents: 'Incidenti di Sicurezza',
        nav_alerts: 'Avvisi di Rilevamento',
        nav_vulnerabilities: 'Vulnerabilità',
        nav_fleet_map: 'Mappa Geografica Flotta',
        nav_threat_hunting: 'Laboratorio Caccia alle Minacce',
        nav_sandbox: 'Sandbox di Detonazione',
        nav_easm: 'Superficie di Attacco Esterna',
        nav_waap: 'Sicurezza Web e API (WAAP)',
        nav_dlp: 'Prevenzione Fuga Dati (DLP)',
        nav_policies: 'Criteri di Sicurezza',
        nav_reports: 'Report di Audit',
        nav_settings: 'Impostazioni',
        nav_sign_out: 'Disconnetti',
        hdr_search_placeholder: 'Cerca endpoint, minacce, incidenti... (Ctrl+K)',
        hdr_inbound_traffic: 'Traffico in Ingresso',
        hdr_active_connections: 'Connessioni Attive',
        hdr_live_attack: 'Attacco in Corso',
        hdr_monitored: 'Monitorato',
        hdr_status_operational: 'Tutti i Sistemi Operativi',
        hdr_dark_mode: 'Cambia Tema',
        hdr_notifications: 'Notifiche',
        hdr_country_language: 'Paese / Lingua',
        kpi_total_endpoints: 'Endpoint Totali',
        kpi_critical_threats: 'Minacce Critiche',
        kpi_compliance_score: 'Punteggio di Conformità',
        kpi_mean_time_contain: 'Tempo Medio di Contenimento',
        lbl_sovereign_node: 'Nodo Sovrano',
        lbl_air_gapped_verified: 'Verifica Air-Gapped Superata',
        lbl_zero_mock_data: 'Telemetria 100% in Tempo Reale',
        lbl_quick_isolate: 'Isola Endpoint',
        lbl_view_details: 'Visualizza Dettagli',
    }
};

/**
 * Determine best matching country and language based on browser environment
 */
export function detectBrowserCountryLanguage(): { countryCode: string; languageCode: string } {
    try {
        const navLang = (navigator.language || (navigator as any).userLanguage || 'en-US').toLowerCase();
        
        // Exact language code match
        for (const opt of SUPPORTED_COUNTRIES) {
            if (opt.languageCode.toLowerCase() === navLang) {
                return { countryCode: opt.countryCode, languageCode: opt.languageCode };
            }
        }

        // Language prefix match (e.g. 'de' matches 'de-DE', 'fr' matches 'fr-FR', 'ar' matches 'ar-SA')
        const langPrefix = navLang.split('-')[0];
        for (const opt of SUPPORTED_COUNTRIES) {
            if (opt.languageCode.toLowerCase().startsWith(langPrefix)) {
                return { countryCode: opt.countryCode, languageCode: opt.languageCode };
            }
        }

        // Timezone based country deduction
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata')) return { countryCode: 'IN', languageCode: 'hi-IN' };
        if (timeZone.includes('Berlin') || timeZone.includes('Frankfurt')) return { countryCode: 'DE', languageCode: 'de-DE' };
        if (timeZone.includes('Paris')) return { countryCode: 'FR', languageCode: 'fr-FR' };
        if (timeZone.includes('Madrid')) return { countryCode: 'ES', languageCode: 'es-ES' };
        if (timeZone.includes('Riyadh')) return { countryCode: 'SA', languageCode: 'ar-SA' };
        if (timeZone.includes('Dubai')) return { countryCode: 'AE', languageCode: 'ar-AE' };
        if (timeZone.includes('Sao_Paulo')) return { countryCode: 'BR', languageCode: 'pt-BR' };
        if (timeZone.includes('Tokyo')) return { countryCode: 'JP', languageCode: 'ja-JP' };
        if (timeZone.includes('Shanghai') || timeZone.includes('Beijing')) return { countryCode: 'CN', languageCode: 'zh-CN' };
        if (timeZone.includes('Seoul')) return { countryCode: 'KR', languageCode: 'ko-KR' };
        if (timeZone.includes('Rome')) return { countryCode: 'IT', languageCode: 'it-IT' };
        if (timeZone.includes('London')) return { countryCode: 'GB', languageCode: 'en-GB' };

    } catch (e) {
        // Fallback gracefully on air-gapped / sandbox errors
    }

    return { countryCode: 'US', languageCode: 'en-US' };
}


declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    PORT: string;

    MONGODB_URI: string;
    JWT_SECRET: string;
    EMAIL_USER: string;
    EMAIL_PASSWORD: string;
    ADMIN_EMAIL: string;
    REQUESTS_LIMIT: string;
    ICERY_API_URL: string;
    ICERY_API_KEY: string;
    ENABLE_GEO_BLOCKING: string;
    ENABLE_VPN_BLOCKING: string;

    NEXT_PUBLIC_ICERY: string;
    NEXT_PUBLIC_SITENAME: string;
    NEXT_PUBLIC_BASE_URL: string;
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_FEATURED_IMAGE_URL: string;
    NEXT_PUBLIC_FEATURED_IMAGE: string;
    NEXT_PUBLIC_FEATURED_IMAGE_FOLDER: string;
    NEXT_PUBLIC_GOOGLE_API_MAP_KEY: string;
    NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT: string;
    NEXT_PUBLIC_GOOGLE_MAP_ID_DARK: string;
    NEXT_PUBLIC_GA_MEASUREMENT_ID: string;
    NEXT_PUBLIC_ARTICLE_FEATURED_FOLDER: string;
    NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER: string;
    NEXT_PUBLIC_COURT_FEATURED_FOLDER: string;
    NEXT_PUBLIC_PLAYER_FEATURED_FOLDER: string;

    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  }
}

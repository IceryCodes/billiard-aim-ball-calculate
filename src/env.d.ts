declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production';
    PORT: string;

    NEXT_PUBLIC_GA_MEASUREMENT_ID: string;
  }
}

/**
 * Global Type Declarations
 * 
 * このファイルはTypeScriptの型定義を拡張し、
 * CSS、画像、その他のアセットファイルのインポートを可能にします。
 */

// CSS Files (global styles)
declare module '*.css';

// Image Files
declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// Font Files
declare module '*.woff' {
  const content: string;
  export default content;
}

declare module '*.woff2' {
  const content: string;
  export default content;
}

declare module '*.ttf' {
  const content: string;
  export default content;
}

declare module '*.otf' {
  const content: string;
  export default content;
}

// JSON Files
declare module '*.json' {
  const content: any;
  export default content;
}

// Environment Variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_APP_URL?: string;
    NEXT_PUBLIC_AMPLIFY_REGION?: string;
    NEXT_PUBLIC_AMPLIFY_USER_POOL_ID?: string;
    NEXT_PUBLIC_AMPLIFY_USER_POOL_CLIENT_ID?: string;
    NEXT_PUBLIC_AMPLIFY_IDENTITY_POOL_ID?: string;
    NEXT_PUBLIC_AMPLIFY_GRAPHQL_ENDPOINT?: string;
    NEXT_PUBLIC_AMPLIFY_GRAPHQL_API_KEY?: string;
  }
}

// Window Extensions
declare global {
  interface Window {
    // Google Analytics
    gtag?: (...args: any[]) => void;
    
    // Development tools
    __NEXT_DATA__?: any;
    
    // Custom properties
    magiSystem?: {
      debug: boolean;
      version: string;
    };
  }
}

export {};
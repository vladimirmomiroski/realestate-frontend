export type Dictionary = {
  common: {
    appName: string;
  };

  navigation: {
    listings: string;
    login: string;
    register: string;
    dashboard: string;
    saved: string;
    profile: string;
    admin: string;
    users: string;
  };

  home: {
    eyebrow: string;
    title: string;
    description: string;
  };

  theme: {
    toggle: string;
    light: string;
    dark: string;
  };
};

export type NavigationKey = keyof Dictionary["navigation"];

import type { StrapiApp } from '@strapi/strapi/admin';

import AuthLogo from './extensions/colaberry-ai-logo.svg';
import MenuLogo from './extensions/colaberry-icon.svg';

export default {
  config: {
    // --- Colaberry logo branding ---
    auth: {
      logo: AuthLogo,
    },
    menu: {
      logo: MenuLogo,
    },

    // --- Theme: Colaberry coral accent colors ---
    theme: {
      light: {
        colors: {
          primary100: '#FEF2F2',
          primary200: '#FECACA',
          primary500: '#EF4444',
          primary600: '#DC2626',
          primary700: '#B91C1C',
          buttonPrimary500: '#EF4444',
          buttonPrimary600: '#DC2626',
        },
      },
      dark: {
        colors: {
          primary100: '#1C1917',
          primary200: '#44403C',
          primary500: '#F87171',
          primary600: '#F87171',
          primary700: '#FCA5A5',
          buttonPrimary500: '#F87171',
          buttonPrimary600: '#EF4444',
        },
      },
    },

    // --- Disable non-production elements ---
    tutorials: false,
    notifications: {
      releases: false,
    },

    // --- English only ---
    locales: [],

    // --- Custom translations: remove Strapi branding ---
    translations: {
      en: {
        'Auth.form.welcome.title': 'Welcome to Colaberry AI',
        'Auth.form.welcome.subtitle': 'Log in to your CMS',
      },
    },
  },

  bootstrap(_app: StrapiApp) {
    // Single-screen Auth0 SSO: auto-redirect to Auth0 when hitting /auth/login.
    // Only active in production (set STRAPI_ADMIN_SSO_ENABLED=true in prod env).
    // Local dev uses standard email/password login.
    const SSO_ENABLED = process.env.STRAPI_ADMIN_SSO_ENABLED === 'true';
    if (!SSO_ENABLED) return;

    const SSO_URL = '/strapi-plugin-sso/oidc';
    const SKIP_PARAM = 'sso=skip';

    const autoRedirectToSSO = () => {
      const path = window.location.pathname;
      const search = window.location.search;

      if (!path.includes('/auth/login')) return;

      if (search.includes(SKIP_PARAM)) {
        if (document.getElementById('sso-fallback-note')) return;
        const form = document.querySelector('form');
        if (!form) return;

        const note = document.createElement('div');
        note.id = 'sso-fallback-note';
        note.style.cssText =
          'margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%;';

        const divider = document.createElement('div');
        divider.style.cssText =
          'display: flex; align-items: center; gap: 8px; width: 100%; color: #a1a1aa; font-size: 12px;';
        divider.innerHTML =
          '<span style="flex:1;height:1px;background:#3f3f46"></span>OR<span style="flex:1;height:1px;background:#3f3f46"></span>';

        const link = document.createElement('a');
        link.href = SSO_URL;
        link.textContent = 'Sign in with Auth0 SSO';
        link.style.cssText =
          'color: #DC2626; font-size: 13px; font-weight: 500; text-decoration: underline; cursor: pointer;';

        note.appendChild(divider);
        note.appendChild(link);
        form.parentElement?.appendChild(note);
        return;
      }

      if (sessionStorage.getItem('sso_redirect_pending')) return;
      sessionStorage.setItem('sso_redirect_pending', '1');
      window.location.href = SSO_URL;
    };

    const clearRedirectGuard = () => {
      if (!window.location.pathname.includes('/auth/login')) {
        sessionStorage.removeItem('sso_redirect_pending');
      }
    };

    const observer = new MutationObserver(() => {
      clearRedirectGuard();
      autoRedirectToSSO();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      clearRedirectGuard();
      autoRedirectToSSO();
    }, 300);
  },
};

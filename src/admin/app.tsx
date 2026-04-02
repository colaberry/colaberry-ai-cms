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

  bootstrap(app: StrapiApp) {
    // Single-screen Auth0 SSO: auto-redirect to Auth0 when hitting /auth/login.
    // This eliminates the intermediate Strapi login page — users go straight
    // to Auth0 Universal Login (one screen instead of two).
    //
    // The strapi-plugin-sso plugin exposes /strapi-plugin-sso/oidc which
    // initiates the OIDC authorization_code flow with PKCE.
    //
    // Fallback: if ?sso=skip is in the URL, show the normal Strapi login
    // (useful for super-admin recovery if Auth0 is down).
    const SSO_URL = '/strapi-plugin-sso/oidc';
    const SKIP_PARAM = 'sso=skip';

    const autoRedirectToSSO = () => {
      const path = window.location.pathname;
      const search = window.location.search;

      // Only act on the login page
      if (!path.includes('/auth/login')) return;

      // Allow bypassing SSO with ?sso=skip for super-admin fallback
      if (search.includes(SKIP_PARAM)) {
        // Show a small fallback note instead of redirecting
        if (document.getElementById('sso-fallback-note')) return;
        const form = document.querySelector('form');
        if (!form) return;

        const note = document.createElement('div');
        note.id = 'sso-fallback-note';
        note.style.cssText =
          'margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%;';

        // Divider
        const divider = document.createElement('div');
        divider.style.cssText =
          'display: flex; align-items: center; gap: 8px; width: 100%; color: #a1a1aa; font-size: 12px;';
        divider.innerHTML =
          '<span style="flex:1;height:1px;background:#3f3f46"></span>OR<span style="flex:1;height:1px;background:#3f3f46"></span>';

        // SSO link for manual trigger
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

      // Prevent redirect loops — only redirect once per page load
      if (sessionStorage.getItem('sso_redirect_pending')) return;
      sessionStorage.setItem('sso_redirect_pending', '1');

      // Auto-redirect to Auth0 SSO
      window.location.href = SSO_URL;
    };

    // Clear the redirect guard when NOT on the login page
    // (i.e., after successful SSO callback lands on the dashboard)
    const clearRedirectGuard = () => {
      if (!window.location.pathname.includes('/auth/login')) {
        sessionStorage.removeItem('sso_redirect_pending');
      }
    };

    // Observe DOM changes for client-side route transitions
    const observer = new MutationObserver(() => {
      clearRedirectGuard();
      autoRedirectToSSO();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also try immediately in case the login page is already rendered
    setTimeout(() => {
      clearRedirectGuard();
      autoRedirectToSSO();
    }, 300);
  },
};

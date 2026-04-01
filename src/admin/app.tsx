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
    // Inject "Sign in with Auth0" SSO button on the admin login page.
    // The strapi-plugin-sso plugin exposes /strapi-plugin-sso/oidc which
    // redirects to Auth0 Universal Login. We add a visible button so
    // admins don't need to know the raw URL.
    const SSO_URL = '/strapi-plugin-sso/oidc';

    const injectSsoButton = () => {
      // Only act on the login page
      if (!window.location.pathname.includes('/auth/login')) return;
      // Don't inject twice
      if (document.getElementById('sso-auth0-btn')) return;

      // Find the login form's submit button to anchor our injection
      const form = document.querySelector('form');
      if (!form) return;

      // Create a divider + button container
      const wrapper = document.createElement('div');
      wrapper.id = 'sso-auth0-btn';
      wrapper.style.cssText =
        'margin-top: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%;';

      // Divider
      const divider = document.createElement('div');
      divider.style.cssText =
        'display: flex; align-items: center; gap: 8px; width: 100%; color: #a1a1aa; font-size: 12px;';
      divider.innerHTML =
        '<span style="flex:1;height:1px;background:#3f3f46"></span>OR<span style="flex:1;height:1px;background:#3f3f46"></span>';

      // SSO Button
      const btn = document.createElement('a');
      btn.href = SSO_URL;
      btn.textContent = 'Sign in with Auth0 SSO';
      btn.style.cssText = [
        'display: inline-flex',
        'align-items: center',
        'justify-content: center',
        'width: 100%',
        'padding: 10px 16px',
        'border-radius: 4px',
        'font-size: 14px',
        'font-weight: 600',
        'text-decoration: none',
        'color: #ffffff',
        'background: #DC2626',
        'border: none',
        'cursor: pointer',
        'transition: background 0.15s ease',
      ].join(';');
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#B91C1C';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = '#DC2626';
      });

      wrapper.appendChild(divider);
      wrapper.appendChild(btn);
      form.parentElement?.appendChild(wrapper);
    };

    // Observe DOM changes to catch client-side route transitions to /auth/login
    const observer = new MutationObserver(() => {
      injectSsoButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also try immediately in case the login page is already rendered
    setTimeout(injectSsoButton, 500);
    setTimeout(injectSsoButton, 1500);
  },
};

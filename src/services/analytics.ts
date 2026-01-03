import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || 'YOUR_MIXPANEL_TOKEN';

const isDev = import.meta.env.DEV;

export const Analytics = {
    init: () => {
        if (!MIXPANEL_TOKEN || MIXPANEL_TOKEN === 'YOUR_MIXPANEL_TOKEN') {
            console.warn("Mixpanel Token not found. Analytics disabled.");
            return;
        }
        mixpanel.init(MIXPANEL_TOKEN, {
            debug: isDev,
            track_pageview: true,
            persistence: 'localStorage'
        });
    },

    identify: (userId: string, traits?: any) => {
        if (!(mixpanel as any).__loaded) return;
        mixpanel.identify(userId);
        if (traits) mixpanel.people.set(traits);
    },

    track: (event: string, props?: any) => {
        if (!(mixpanel as any).__loaded) return;
        mixpanel.track(event, props);
    },

    reset: () => {
        if (!(mixpanel as any).__loaded) return;
        mixpanel.reset();
    }
};

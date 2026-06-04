import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';

export default function AntiTamper() {
    const { user } = useAuth();
    const [shouldEnable, setShouldEnable] = useState(false);

    useEffect(() => {
        // Fetch global public config
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_URL}/system/settings/public`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setShouldEnable(data.EnableGlobalAntiTamper === 'true');
                }
            } catch (err) {
                // If backend is unreachable, default to true for safety
                setShouldEnable(true);
            }
        };
        fetchConfig();

        const handleConfigChange = () => fetchConfig();
        window.addEventListener('configChanged', handleConfigChange);
        return () => window.removeEventListener('configChanged', handleConfigChange);
    }, []);

    useEffect(() => {
        // Only run anti-tamper protections in production mode
        if (!import.meta.env.PROD) {
            console.log("%c[Monitorix] Dev Mode: Anti-tampering disabled.", "color: #3b82f6; font-weight: bold;");
            return;
        }

        // Exemption for SuperAdmin
        if (user?.role === 'SuperAdmin') {
            console.log("%c[Monitorix] SuperAdmin Mode: Anti-tampering disabled.", "color: #ef4444; font-weight: bold;");
            return;
        }

        // Exemption if globally disabled via UI
        if (!shouldEnable) {
            return;
        }

        // 1. Disable Right Click
        const disableContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
        const disableShortcuts = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault();
            }
            
            // Ctrl+Shift+I or Cmd+Opt+I (DevTools)
            if ((e.ctrlKey && e.shiftKey && e.key === 'I') || (e.metaKey && e.altKey && e.key === 'I') || (e.metaKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
            }
            
            // Ctrl+Shift+J or Cmd+Opt+J (Console)
            if ((e.ctrlKey && e.shiftKey && e.key === 'J') || (e.metaKey && e.altKey && e.key === 'J') || (e.metaKey && e.shiftKey && e.key === 'J')) {
                e.preventDefault();
            }
            
            // Ctrl+Shift+C or Cmd+Opt+C (Inspector)
            if ((e.ctrlKey && e.shiftKey && e.key === 'C') || (e.metaKey && e.altKey && e.key === 'C') || (e.metaKey && e.shiftKey && e.key === 'C')) {
                e.preventDefault();
            }
            
            // Ctrl+U or Cmd+U (View Source)
            if ((e.ctrlKey && e.key === 'u') || (e.metaKey && e.key === 'u') || (e.ctrlKey && e.key === 'U') || (e.metaKey && e.key === 'U')) {
                e.preventDefault();
            }
        };

        // 3. Obfuscate Console
        const noop = () => {};
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        const _info = console.info;

        console.log = noop;
        console.warn = noop;
        console.error = noop;
        console.info = noop;

        // Force a clear loop
        const clearLoop = setInterval(() => {
            console.clear();
        }, 1000);

        // 4. Anti-Debugging Trap
        // This runs an infinite debugger loop if DevTools is open.
        // If DevTools is closed, the browser optimizes it out and ignores it.
        const debuggerLoop = setInterval(() => {
            // eslint-disable-next-line no-debugger
            debugger;
        }, 100);

        // Apply Listeners
        document.addEventListener('contextmenu', disableContextMenu);
        document.addEventListener('keydown', disableShortcuts);

        // Prevent dragging to highlight text
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        return () => {
            document.removeEventListener('contextmenu', disableContextMenu);
            document.removeEventListener('keydown', disableShortcuts);
            clearInterval(clearLoop);
            clearInterval(debuggerLoop);
            document.body.style.userSelect = 'auto';
            document.body.style.webkitUserSelect = 'auto';
            
            // Restore console (rarely needed since this lives at app root, but good practice)
            console.log = _log;
            console.warn = _warn;
            console.error = _error;
            console.info = _info;
        };
    }, [user, shouldEnable]);

    return null; // This component does not render any UI
}

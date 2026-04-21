/**
 * Registra visitas al sitio público vía Supabase RPC (record_site_visit).
 * Requiere ejecutar database/page_analytics.sql en el proyecto Supabase.
 */
(function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    var path = (window.location && window.location.pathname) || '/';
    if (/admin\.html?$/i.test(path) || path.indexOf('admin.html') !== -1) {
        return;
    }

    var cfg = window.COMPUTEC_SUPABASE_PUBLIC;
    if (!cfg || !cfg.url || !cfg.anonKey) {
        return;
    }

    var STORAGE_VID = 'computec_site_visitor_id';
    var STORAGE_LAST = 'computec_site_visit_last_ms';
    var THROTTLE_MS = 30000;

    function getVisitorId() {
        try {
            var v = localStorage.getItem(STORAGE_VID);
            if (v && v.length >= 8) {
                return v;
            }
            if (window.crypto && crypto.randomUUID) {
                v = crypto.randomUUID();
            } else {
                v = 'v_' + String(Date.now()) + '_' + String(Math.random()).slice(2, 12);
            }
            localStorage.setItem(STORAGE_VID, v);
            return v;
        } catch (e) {
            return null;
        }
    }

    function shouldSend() {
        try {
            var last = parseInt(localStorage.getItem(STORAGE_LAST) || '0', 10);
            if (Date.now() - last < THROTTLE_MS) {
                return false;
            }
            localStorage.setItem(STORAGE_LAST, String(Date.now()));
            return true;
        } catch (e2) {
            return true;
        }
    }

    function recordVisit() {
        if (!shouldSend()) {
            return;
        }

        var payload = {
            p_path: path.slice(0, 512) || '/',
            p_visitor_id: getVisitorId()
        };

        fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/rpc/record_site_visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: cfg.anonKey,
                Authorization: 'Bearer ' + cfg.anonKey,
                Prefer: 'return=minimal'
            },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(function () {
            /* silencioso: sitio funciona sin analítica */
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', recordVisit);
    } else {
        recordVisit();
    }
})();

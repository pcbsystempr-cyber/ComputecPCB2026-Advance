// Efecto de inclinación 3D: sigue el cursor en escritorio y usa el giroscopio en móvil.
(function () {
    'use strict';

    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const SELECTOR = '.projection-card, .course-card, .project-card, .news-card, .proof-card';
    const MAX_TILT = 0.8; // grados (muy sutil)
    const PERSPECTIVE = 1600;
    const LIFT = 0.4; // px translateY al interactuar
    const SCALE = 1.0008;

    const isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

    function setTilt(el, rx, ry, lift = LIFT, scale = SCALE) {
        el.style.transform =
            `perspective(${PERSPECTIVE}px) translateY(${-lift}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
        el.style.willChange = 'transform';
    }

    function resetTilt(el) {
        el.style.transform = '';
        el.style.willChange = '';
    }

    // ---------- Escritorio: seguimiento del cursor ----------
    function bindPointerTilt(el) {
        let rafId = null;
        let pendingX = 0;
        let pendingY = 0;
        let active = false;

        const apply = () => {
            rafId = null;
            if (!active) return;
            setTilt(el, pendingX, pendingY);
        };

        const onMove = (e) => {
            const rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            pendingY = (px - 0.5) * 2 * MAX_TILT;
            pendingX = (0.5 - py) * 2 * MAX_TILT;
            if (rafId === null) rafId = requestAnimationFrame(apply);
        };

        const onEnter = () => { active = true; el.style.transition = 'transform 0.15s ease-out'; };
        const onLeave = () => {
            active = false;
            if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
            el.style.transition = 'transform 0.4s ease';
            resetTilt(el);
            setTimeout(() => { el.style.transition = ''; }, 420);
        };

        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerleave', onLeave);
        el.addEventListener('pointercancel', onLeave);
    }

    // ---------- Móvil: giroscopio ----------
    const gyroTargets = new Set();
    let gyroVisible = new Set();
    let gyroRaf = null;
    let pendingBeta = 0;
    let pendingGamma = 0;
    let gyroStarted = false;

    function applyGyro() {
        gyroRaf = null;
        // beta: -180..180 (frente-atrás), gamma: -90..90 (izq-der)
        const ry = Math.max(-MAX_TILT, Math.min(MAX_TILT, (pendingGamma / 45) * MAX_TILT));
        const rx = Math.max(-MAX_TILT, Math.min(MAX_TILT, ((pendingBeta - 35) / 45) * MAX_TILT));
        gyroVisible.forEach((el) => setTilt(el, rx, ry, 0.1, 1.0002));
    }

    function onOrientation(e) {
        if (e.gamma === null || e.beta === null) return;
        pendingBeta = e.beta;
        pendingGamma = e.gamma;
        if (gyroRaf === null) gyroRaf = requestAnimationFrame(applyGyro);
    }

    function startGyro() {
        if (gyroStarted) return;
        gyroStarted = true;
        window.addEventListener('deviceorientation', onOrientation, { passive: true });

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) gyroVisible.add(entry.target);
                else { gyroVisible.delete(entry.target); resetTilt(entry.target); }
            });
        }, { threshold: 0.4 });

        gyroTargets.forEach((el) => {
            el.style.transition = 'transform 0.25s ease-out';
            io.observe(el);
        });
    }

    function requestGyroPermissionIfNeeded() {
        const Eo = window.DeviceOrientationEvent;
        if (Eo && typeof Eo.requestPermission === 'function') {
            const handler = () => {
                Eo.requestPermission().then((state) => {
                    if (state === 'granted') startGyro();
                }).catch(() => { /* ignorar */ });
                document.removeEventListener('touchend', handler);
                document.removeEventListener('click', handler);
            };
            document.addEventListener('touchend', handler, { once: true, passive: true });
            document.addEventListener('click', handler, { once: true });
        } else {
            startGyro();
        }
    }

    // ---------- Inicialización ----------
    function init() {
        const cards = document.querySelectorAll(SELECTOR);
        if (!cards.length) return;

        if (supportsHover && !isCoarsePointer) {
            cards.forEach(bindPointerTilt);
        }

        if (isCoarsePointer && 'DeviceOrientationEvent' in window) {
            cards.forEach((el) => gyroTargets.add(el));
            requestGyroPermissionIfNeeded();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

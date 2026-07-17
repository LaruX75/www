document.addEventListener('DOMContentLoaded', () => {
    const defaultSettings = {
        textSize: 'normal',
        highContrast: false,
        reducedMotion: false,
        screenReaderAssist: false,
        dyslexiaFont: false,
        textSpacing: false,
        readingGuide: false,
        backgroundColor: ''
    };

    let a11ySettings;
    try {
        const stored = localStorage.getItem('a11y-settings');
        a11ySettings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : { ...defaultSettings };
    } catch (e) {
        a11ySettings = { ...defaultSettings };
    }

    const toolbar = document.getElementById('a11yToolbar');
    const trigger = document.getElementById('a11yTrigger');
    const panel = document.getElementById('a11yPanel');
    const closeBtn = document.getElementById('a11yClose');
    const fontDecBtn = document.getElementById('a11yFontDec');
    const fontResetBtn = document.getElementById('a11yFontReset');
    const fontIncBtn = document.getElementById('a11yFontInc');
    const highContrastToggle = document.getElementById('a11yHighContrast');
    const reducedMotionToggle = document.getElementById('a11yReducedMotion');
    const focusAssistToggle = document.getElementById('a11yFocusAssist');
    const dyslexiaFontToggle = document.getElementById('a11yDyslexiaFont');
    const textSpacingToggle = document.getElementById('a11yTextSpacing');
    const readingGuideToggle = document.getElementById('a11yReadingGuide');
    const readingGuideLine = document.getElementById('a11yReadingGuideLine');
    const swatches = Array.from(document.querySelectorAll('.a11y-swatch'));
    const ttsSection = document.querySelector('.a11y-tts-section');
    const ttsPlayBtn = document.getElementById('a11yTtsPlay');
    const ttsStopBtn = document.getElementById('a11yTtsStop');
    const statusRegion = document.getElementById('a11yStatus');
    const resetBtn = document.getElementById('a11yResetBtn');
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    const lang = document.documentElement.lang || 'fi';
    const tts = window.speechSynthesis;
    const textSizes = ['normal', 'large', 'xlarge'];
    let previouslyFocused = null;
    let ttsActive = false;

    const announce = (message) => {
        if (!statusRegion || !message) return;
        statusRegion.textContent = '';
        window.setTimeout(() => {
            statusRegion.textContent = message;
        }, 20);
    };

    const setPressed = (element, active) => {
        if (element) element.setAttribute('aria-pressed', active ? 'true' : 'false');
    };

    const applyUiState = () => {
        const sizeIndex = textSizes.indexOf(a11ySettings.textSize);
        const safeSizeIndex = sizeIndex === -1 ? 0 : sizeIndex;

        if (fontDecBtn) fontDecBtn.disabled = safeSizeIndex === 0;
        if (fontResetBtn) fontResetBtn.disabled = safeSizeIndex === 0;
        if (fontIncBtn) fontIncBtn.disabled = safeSizeIndex === textSizes.length - 1;

        setPressed(highContrastToggle, a11ySettings.highContrast);
        setPressed(reducedMotionToggle, a11ySettings.reducedMotion);
        setPressed(focusAssistToggle, a11ySettings.screenReaderAssist);
        setPressed(dyslexiaFontToggle, a11ySettings.dyslexiaFont);
        setPressed(textSpacingToggle, a11ySettings.textSpacing);
        setPressed(readingGuideToggle, a11ySettings.readingGuide);

        swatches.forEach((swatch) => {
            const isActive = (swatch.dataset.a11yBg || '') === (a11ySettings.backgroundColor || '');
            swatch.classList.toggle('is-active', isActive);
            swatch.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };

    const saveAndApply = (message) => {
        try {
            localStorage.setItem('a11y-settings', JSON.stringify(a11ySettings));
        } catch (e) {}

        if (typeof window.applyA11ySettings === 'function') {
            window.applyA11ySettings(a11ySettings);
        }

        applyUiState();
        announce(message);
    };

    const getFocusable = (container) => {
        if (!container) return [];
        return Array.from(container.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((el) => !el.hidden && el.offsetParent !== null);
    };

    const trapPanelFocus = (event) => {
        if (!panel || panel.hidden || event.key !== 'Tab') return;
        const focusable = getFocusable(panel);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const openPanel = () => {
        if (!panel || !trigger) return;
        previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
        panel.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        panel.addEventListener('keydown', trapPanelFocus);
        const firstFocusable = getFocusable(panel)[0];
        if (firstFocusable) firstFocusable.focus();
    };

    const closePanel = () => {
        if (!panel || !trigger) return;
        panel.hidden = true;
        panel.removeEventListener('keydown', trapPanelFocus);
        trigger.setAttribute('aria-expanded', 'false');
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
        } else {
            trigger.focus();
        }
    };

    const setTtsState = (active) => {
        ttsActive = active;
        if (ttsPlayBtn) ttsPlayBtn.disabled = active;
        if (ttsStopBtn) ttsStopBtn.disabled = !active;
    };

    const stopSpeaking = () => {
        setTtsState(false);
        if (tts) tts.cancel();
    };

    const speakMainContent = () => {
        if (!tts || typeof window.SpeechSynthesisUtterance !== 'function') return;

        stopSpeaking();

        const root = document.querySelector('#main-content') || document.querySelector('main') || document.body;
        const text = (root.innerText || root.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text) return;

        const langMap = { fi: 'fi-FI', en: 'en-GB', sv: 'sv-SE' };
        const chunks = text.match(/.{1,220}(?:\s|$)/g) || [text];
        let index = 0;
        setTtsState(true);
        announce(isEn ? 'Reading started.' : 'Lukeminen aloitettu.');

        const speakNext = () => {
            if (!ttsActive || index >= chunks.length) {
                setTtsState(false);
                announce(isEn ? 'Reading finished.' : 'Lukeminen päättynyt.');
                return;
            }

            const utterance = new window.SpeechSynthesisUtterance(chunks[index++]);
            utterance.lang = langMap[lang.slice(0, 2)] || 'fi-FI';
            utterance.rate = 0.9;
            utterance.onend = speakNext;
            utterance.onerror = () => {
                setTtsState(false);
                announce(isEn ? 'Reading stopped.' : 'Lukeminen pysäytetty.');
            };
            tts.speak(utterance);
        };

        speakNext();
    };

    const setTextSizeByStep = (step) => {
        const currentIndex = Math.max(0, textSizes.indexOf(a11ySettings.textSize));
        const nextIndex = Math.max(0, Math.min(textSizes.length - 1, currentIndex + step));
        a11ySettings.textSize = textSizes[nextIndex];
        saveAndApply(isEn ? 'Text size updated.' : 'Tekstin koko päivitetty.');
    };

    if (trigger) {
        trigger.addEventListener('click', () => {
            if (!panel) return;
            if (panel.hidden) openPanel();
            else closePanel();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePanel);

    document.addEventListener('click', (event) => {
        if (!toolbar || !panel || panel.hidden) return;
        if (!toolbar.contains(event.target)) closePanel();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && panel && !panel.hidden) closePanel();
    });

    if (fontDecBtn) fontDecBtn.addEventListener('click', () => setTextSizeByStep(-1));
    if (fontResetBtn) {
        fontResetBtn.addEventListener('click', () => {
            a11ySettings.textSize = 'normal';
            saveAndApply(isEn ? 'Text size reset.' : 'Tekstin koko palautettu.');
        });
    }
    if (fontIncBtn) fontIncBtn.addEventListener('click', () => setTextSizeByStep(1));

    if (highContrastToggle) {
        highContrastToggle.addEventListener('click', () => {
            a11ySettings.highContrast = !a11ySettings.highContrast;
            saveAndApply(a11ySettings.highContrast ? (isEn ? 'High contrast enabled.' : 'Korkea kontrasti käytössä.') : (isEn ? 'High contrast disabled.' : 'Korkea kontrasti pois käytöstä.'));
        });
    }

    if (reducedMotionToggle) {
        reducedMotionToggle.addEventListener('click', () => {
            a11ySettings.reducedMotion = !a11ySettings.reducedMotion;
            saveAndApply(a11ySettings.reducedMotion ? (isEn ? 'Reduced motion enabled.' : 'Vähennetty liike käytössä.') : (isEn ? 'Reduced motion disabled.' : 'Vähennetty liike pois käytöstä.'));
        });
    }

    if (focusAssistToggle) {
        focusAssistToggle.addEventListener('click', () => {
            a11ySettings.screenReaderAssist = !a11ySettings.screenReaderAssist;
            saveAndApply(a11ySettings.screenReaderAssist ? (isEn ? 'Focus assistance enabled.' : 'Fokuksen apunäkymä käytössä.') : (isEn ? 'Focus assistance disabled.' : 'Fokuksen apunäkymä pois käytöstä.'));
        });
    }

    if (dyslexiaFontToggle) {
        dyslexiaFontToggle.addEventListener('click', () => {
            a11ySettings.dyslexiaFont = !a11ySettings.dyslexiaFont;
            saveAndApply(a11ySettings.dyslexiaFont ? (isEn ? 'Reading font enabled.' : 'Lukemista tukeva fontti käytössä.') : (isEn ? 'Reading font disabled.' : 'Lukemista tukeva fontti pois käytöstä.'));
        });
    }

    if (textSpacingToggle) {
        textSpacingToggle.addEventListener('click', () => {
            a11ySettings.textSpacing = !a11ySettings.textSpacing;
            saveAndApply(a11ySettings.textSpacing ? (isEn ? 'Wider text spacing enabled.' : 'Väljempi tekstiväli käytössä.') : (isEn ? 'Wider text spacing disabled.' : 'Väljempi tekstiväli pois käytöstä.'));
        });
    }

    if (readingGuideToggle) {
        readingGuideToggle.addEventListener('click', () => {
            a11ySettings.readingGuide = !a11ySettings.readingGuide;
            saveAndApply(a11ySettings.readingGuide ? (isEn ? 'Reading guide enabled.' : 'Lukuviivain käytössä.') : (isEn ? 'Reading guide disabled.' : 'Lukuviivain pois käytöstä.'));
        });
    }

    if (readingGuideLine) {
        document.addEventListener('mousemove', (event) => {
            if (!a11ySettings.readingGuide) return;
            readingGuideLine.style.top = `${Math.max(0, event.clientY - 22)}px`;
        });
    }

    swatches.forEach((swatch) => {
        swatch.addEventListener('click', () => {
            a11ySettings.backgroundColor = swatch.dataset.a11yBg || '';
            saveAndApply(isEn ? 'Background updated.' : 'Tausta päivitetty.');
        });
    });

    if (!tts || typeof window.SpeechSynthesisUtterance !== 'function') {
        if (ttsSection) ttsSection.hidden = true;
    } else {
        if (ttsPlayBtn) ttsPlayBtn.addEventListener('click', speakMainContent);
        if (ttsStopBtn) {
            ttsStopBtn.addEventListener('click', () => {
                stopSpeaking();
                announce(isEn ? 'Reading stopped.' : 'Lukeminen pysäytetty.');
            });
        }
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            a11ySettings = { ...defaultSettings };
            stopSpeaking();
            saveAndApply(isEn ? 'Accessibility settings reset.' : 'Saavutettavuusasetukset nollattu.');
        });
    }

    if (typeof window.applyA11ySettings === 'function') {
        window.applyA11ySettings(a11ySettings);
    }
    applyUiState();
});

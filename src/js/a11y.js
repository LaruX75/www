document.addEventListener('DOMContentLoaded', () => {
    // Oletusasetukset
    const defaultSettings = {
        textSize: 'normal', // normal, large, xlarge
        highContrast: false,
        reducedMotion: false,
        screenReaderAssist: false,
        dyslexiaFont: false
    };

    // Lataa asetukset tai käytä oletuksia
    let a11ySettings;
    try {
        const stored = localStorage.getItem('a11y-settings');
        a11ySettings = stored ? JSON.parse(stored) : { ...defaultSettings };
    } catch (e) {
        a11ySettings = { ...defaultSettings };
    }

    // DOM elementit
    const textSizeSelect = document.getElementById('a11yTextSize');
    const highContrastToggle = document.getElementById('a11yHighContrast');
    const reducedMotionToggle = document.getElementById('a11yReducedMotion');
    const screenReaderAssistToggle = document.getElementById('a11yScreenReaderAssist');
    const dyslexiaFontToggle = document.getElementById('a11yDyslexiaFont');
    const ttsSection = document.querySelector('.a11y-tts-section');
    const ttsPlayBtn = document.getElementById('a11yTtsPlay');
    const ttsStopBtn = document.getElementById('a11yTtsStop');
    const statusRegion = document.getElementById('a11yStatus');
    const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
    const lang = document.documentElement.lang || 'fi';
    const tts = window.speechSynthesis;
    let ttsActive = false;

    // Set initial states in UI
    if (textSizeSelect) textSizeSelect.value = a11ySettings.textSize || 'normal';
    if (highContrastToggle) highContrastToggle.checked = !!a11ySettings.highContrast;
    if (reducedMotionToggle) reducedMotionToggle.checked = !!a11ySettings.reducedMotion;
    if (screenReaderAssistToggle) screenReaderAssistToggle.checked = !!a11ySettings.screenReaderAssist;
    if (dyslexiaFontToggle) dyslexiaFontToggle.checked = !!a11ySettings.dyslexiaFont;

    const announce = (message) => {
        if (!statusRegion || !message) return;
        statusRegion.textContent = '';
        window.setTimeout(() => {
            statusRegion.textContent = message;
        }, 20);
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

    // Tallennus ja päivitys
    const saveAndApply = () => {
        localStorage.setItem('a11y-settings', JSON.stringify(a11ySettings));
        applyA11ySettings(a11ySettings);
    };

    // Event listenerit kytkimille
    if (textSizeSelect) {
        textSizeSelect.addEventListener('change', (e) => {
            a11ySettings.textSize = e.target.value;
            saveAndApply();
        });
    }

    if (highContrastToggle) {
        highContrastToggle.addEventListener('change', (e) => {
            a11ySettings.highContrast = e.target.checked;
            saveAndApply();
        });
    }

    if (reducedMotionToggle) {
        reducedMotionToggle.addEventListener('change', (e) => {
            a11ySettings.reducedMotion = e.target.checked;
            saveAndApply();
            announce(
                e.target.checked
                    ? (isEn ? 'Reduced motion enabled.' : 'Vähennetty liike käytössä.')
                    : (isEn ? 'Reduced motion disabled.' : 'Vähennetty liike pois käytöstä.')
            );
        });
    }

    if (screenReaderAssistToggle) {
        screenReaderAssistToggle.addEventListener('change', (e) => {
            a11ySettings.screenReaderAssist = e.target.checked;
            saveAndApply();
            announce(
                e.target.checked
                    ? (isEn ? 'Screen reader support mode enabled.' : 'Ruudunlukijan tukitila käytössä.')
                    : (isEn ? 'Screen reader support mode disabled.' : 'Ruudunlukijan tukitila pois käytöstä.')
            );
        });
    }

    if (dyslexiaFontToggle) {
        dyslexiaFontToggle.addEventListener('change', (e) => {
            a11ySettings.dyslexiaFont = e.target.checked;
            saveAndApply();
            announce(
                e.target.checked
                    ? (isEn ? 'Dyslexia-friendly font enabled.' : 'Lukihäiriöystävällinen fontti käytössä.')
                    : (isEn ? 'Dyslexia-friendly font disabled.' : 'Lukihäiriöystävällinen fontti pois käytöstä.')
            );
        });
    }

    if (!tts || typeof window.SpeechSynthesisUtterance !== 'function') {
        if (ttsSection) ttsSection.hidden = true;
    } else {
        if (ttsPlayBtn) {
            ttsPlayBtn.addEventListener('click', () => {
                speakMainContent();
            });
        }

        if (ttsStopBtn) {
            ttsStopBtn.addEventListener('click', () => {
                stopSpeaking();
                announce(isEn ? 'Reading stopped.' : 'Lukeminen pysäytetty.');
            });
        }
    }

    // Palautuspainike
    const resetBtn = document.getElementById('a11yResetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            a11ySettings = { ...defaultSettings };
            if (textSizeSelect) textSizeSelect.value = 'normal';
            if (highContrastToggle) highContrastToggle.checked = false;
            if (reducedMotionToggle) reducedMotionToggle.checked = false;
            if (screenReaderAssistToggle) screenReaderAssistToggle.checked = false;
            if (dyslexiaFontToggle) dyslexiaFontToggle.checked = false;
            stopSpeaking();
            saveAndApply();
            announce(isEn ? 'Accessibility settings reset.' : 'Saavutettavuusasetukset palautettu.');
        });
    }
});

export const BUTTON_AUDIT_PAGES = [
    { name: 'Homepage', path: '/' },
    { name: 'Publications', path: '/julkaisut/' },
    { name: 'Theses', path: '/opinnaytteet/' },
    { name: 'Presentations', path: '/esitykset/' },
    { name: 'CV', path: '/cv/' },
    { name: 'Contact', path: '/yhteystiedot/' },
];

const BUTTON_SELECTOR = [
    'button',
    'a.btn',
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
].join(', ');

const MIN_TEXT_CONTRAST = 4.5;
const MIN_LARGE_TEXT_CONTRAST = 3;
const MIN_COMPONENT_CONTRAST = 3;

function formatRatio(value) {
    return Number.isFinite(value) ? value.toFixed(2) : 'n/a';
}

function formatColor(color) {
    if (!color) {
        return 'n/a';
    }

    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

function formatIssue(issue) {
    const textPart = issue.text
        ? ` "${issue.text}"`
        : '';
    const notePart = issue.note
        ? ` (${issue.note})`
        : '';

    return [
        `[${issue.pageName}] ${issue.selector}${textPart}`,
        `state=${issue.state}`,
        `check=${issue.check}`,
        `ratio=${formatRatio(issue.ratio)}`,
        `expected>=${issue.expected.toFixed(1)}`,
        `fg=${formatColor(issue.foreground)}`,
        `bg=${formatColor(issue.background)}`,
    ].join(' | ') + notePart;
}

async function measureButtonState(locator) {
    return locator.evaluate((element) => {
        const WHITE = { r: 255, g: 255, b: 255, a: 1 };

        function normalizeChannel(value) {
            return Math.max(0, Math.min(255, Math.round(value)));
        }

        function normalizeAlpha(value) {
            const alpha = Number.parseFloat(value);
            return Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1;
        }

        function parseColor(value) {
            if (!value || value === 'transparent') {
                return { r: 0, g: 0, b: 0, a: 0 };
            }

            const rgbMatch = value.match(/rgba?\(([^)]+)\)/i);
            if (!rgbMatch) {
                return { r: 0, g: 0, b: 0, a: 0 };
            }

            const parts = rgbMatch[1].split(',').map((part) => part.trim());
            return {
                r: normalizeChannel(Number.parseFloat(parts[0] || '0')),
                g: normalizeChannel(Number.parseFloat(parts[1] || '0')),
                b: normalizeChannel(Number.parseFloat(parts[2] || '0')),
                a: normalizeAlpha(parts[3] ?? '1'),
            };
        }

        function compositeColor(foreground, background) {
            const alpha = foreground.a + (background.a * (1 - foreground.a));

            if (alpha <= 0) {
                return { r: 0, g: 0, b: 0, a: 0 };
            }

            return {
                r: normalizeChannel(((foreground.r * foreground.a) + (background.r * background.a * (1 - foreground.a))) / alpha),
                g: normalizeChannel(((foreground.g * foreground.a) + (background.g * background.a * (1 - foreground.a))) / alpha),
                b: normalizeChannel(((foreground.b * foreground.a) + (background.b * background.a * (1 - foreground.a))) / alpha),
                a: alpha,
            };
        }

        function getRelativeLuminance(color) {
            function toLinear(channel) {
                const value = channel / 255;
                return value <= 0.03928
                    ? value / 12.92
                    : ((value + 0.055) / 1.055) ** 2.4;
            }

            return (0.2126 * toLinear(color.r))
                + (0.7152 * toLinear(color.g))
                + (0.0722 * toLinear(color.b));
        }

        function getContrastRatio(foreground, background) {
            const foregroundLuminance = getRelativeLuminance(foreground);
            const backgroundLuminance = getRelativeLuminance(background);
            const lighter = Math.max(foregroundLuminance, backgroundLuminance);
            const darker = Math.min(foregroundLuminance, backgroundLuminance);
            return (lighter + 0.05) / (darker + 0.05);
        }

        function normalizeFontWeight(value) {
            if (value === 'bold') {
                return 700;
            }

            if (value === 'normal') {
                return 400;
            }

            const numericWeight = Number.parseInt(value, 10);
            return Number.isFinite(numericWeight) ? numericWeight : 400;
        }

        function collectBackgroundLayers(startElement) {
            const layers = [];
            let current = startElement;

            while (current) {
                const style = window.getComputedStyle(current);
                const backgroundColor = parseColor(style.backgroundColor);

                if (backgroundColor.a > 0) {
                    layers.push(backgroundColor);
                }

                current = current.parentElement;
            }

            layers.push(WHITE);
            return layers;
        }

        function resolveBackground(startElement) {
            const layers = collectBackgroundLayers(startElement);
            let result = layers[layers.length - 1];

            for (let index = layers.length - 2; index >= 0; index -= 1) {
                result = compositeColor(layers[index], result);
            }

            return result;
        }

        function hasComplexBackgroundInChain(startElement) {
            let current = startElement;

            while (current) {
                const style = window.getComputedStyle(current);

                if (style.backgroundImage && style.backgroundImage !== 'none') {
                    return true;
                }

                current = current.parentElement;
            }

            return false;
        }

        function describeElement(target) {
            const classNames = Array.from(target.classList || []).slice(0, 3);
            const classSuffix = classNames.length > 0
                ? `.${classNames.join('.')}`
                : '';
            const idSuffix = target.id ? `#${target.id}` : '';
            return `${target.tagName.toLowerCase()}${idSuffix}${classSuffix}`;
        }

        const style = window.getComputedStyle(element);
        const elementBackground = parseColor(style.backgroundColor);
        const surroundingBackground = resolveBackground(element.parentElement);
        const effectiveElementBackground = compositeColor(elementBackground, surroundingBackground);
        const textColor = parseColor(style.color);
        const borderColor = parseColor(style.borderTopColor);
        const borderWidth = Number.parseFloat(style.borderTopWidth || '0') || 0;
        const fontSize = Number.parseFloat(style.fontSize || '0') || 0;
        const fontWeight = normalizeFontWeight(style.fontWeight);
        const visibleText = (element.innerText || element.value || '')
            .replace(/\s+/g, ' ')
            .trim();
        const accessibleLabel = (
            element.getAttribute('aria-label')
            || visibleText
            || element.getAttribute('title')
            || ''
        ).replace(/\s+/g, ' ').trim();
        const isDisabled = Boolean(
            element.matches(':disabled')
            || element.getAttribute('aria-disabled') === 'true'
            || element.classList.contains('disabled')
        );
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const hasVisibleText = visibleText.length > 0;
        const hasVisibleFill = elementBackground.a >= 0.5;
        const hasVisibleBorder = borderWidth > 0 && style.borderTopStyle !== 'none' && borderColor.a > 0.05;
        const backgroundIsComplex = hasComplexBackgroundInChain(element);

        let componentColor = null;
        let componentContrast = null;
        let componentMode = null;

        if (hasVisibleFill) {
            componentColor = effectiveElementBackground;
            componentContrast = getContrastRatio(componentColor, surroundingBackground);
            componentMode = 'fill';
        } else if (hasVisibleBorder) {
            componentColor = compositeColor(borderColor, surroundingBackground);
            componentContrast = getContrastRatio(componentColor, surroundingBackground);
            componentMode = 'border';
        }

        return {
            selector: describeElement(element),
            text: accessibleLabel,
            isDisabled,
            isLargeText,
            backgroundIsComplex,
            textColor,
            buttonBackground: effectiveElementBackground,
            surroundingBackground,
            textContrast: hasVisibleText
                ? getContrastRatio(textColor, effectiveElementBackground)
                : null,
            componentContrast,
            componentColor,
            componentMode,
        };
    });
}

export async function auditButtonContrastOnPage(page, auditPage) {
    const buttons = page.locator(BUTTON_SELECTOR);

    // Batch visibility check: one roundtrip instead of N
    const visibleIndices = await page.evaluate((selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        return elements
            .map((el, i) => ({ i, visible: el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden' }))
            .filter(({ visible }) => visible)
            .map(({ i }) => i);
    }, BUTTON_SELECTOR);

    const issues = [];

    for (const index of visibleIndices) {
        const locator = buttons.nth(index);

        try {
            await locator.scrollIntoViewIfNeeded({ timeout: 1000 });
        } catch {
            continue;
        }
        const defaultState = await measureButtonState(locator);

        if (defaultState.isDisabled) {
            continue;
        }

        const states = [{ name: 'default', data: defaultState }];

        try {
            await locator.hover({ timeout: 2000 });
            await page.waitForTimeout(300);
            states.push({ name: 'hover', data: await measureButtonState(locator) });
            await page.mouse.move(0, 0);
        } catch (error) {
            // Some controls may be temporarily obscured, covered, or detached during hover attempts.
        }

        for (const state of states) {
            const minTextContrast = state.data.isLargeText
                ? MIN_LARGE_TEXT_CONTRAST
                : MIN_TEXT_CONTRAST;

            if (
                state.data.textContrast !== null
                && state.data.textContrast < minTextContrast
            ) {
                issues.push({
                    pageName: auditPage.name,
                    pagePath: auditPage.path,
                    state: state.name,
                    check: 'text',
                    ratio: state.data.textContrast,
                    expected: minTextContrast,
                    selector: state.data.selector,
                    text: state.data.text,
                    foreground: state.data.textColor,
                    background: state.data.buttonBackground,
                    note: state.data.backgroundIsComplex
                        ? 'background image or gradient present; measured against computed colors'
                        : state.data.note,
                });
            }

            if (
                state.data.componentContrast !== null
                && state.data.componentContrast < MIN_COMPONENT_CONTRAST
            ) {
                issues.push({
                    pageName: auditPage.name,
                    pagePath: auditPage.path,
                    state: state.name,
                    check: `component-${state.data.componentMode}`,
                    ratio: state.data.componentContrast,
                    expected: MIN_COMPONENT_CONTRAST,
                    selector: state.data.selector,
                    text: state.data.text,
                    foreground: state.data.componentColor,
                    background: state.data.surroundingBackground,
                    note: state.data.backgroundIsComplex
                        ? 'background image or gradient present; measured against computed colors'
                        : state.data.note,
                });
            }
        }
    }

    return issues;
}

export function formatContrastIssues(issues) {
    return issues.map(formatIssue).join('\n');
}

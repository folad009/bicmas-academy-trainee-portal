

export function isIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    )
}
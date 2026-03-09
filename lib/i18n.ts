/**
 * ZFENIX i18n System
 * Supports: English (en) | Vietnamese (vi)
 * Default: English
 */

export type Language = 'en' | 'vi';

export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
];

export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_STORAGE_KEY = 'zfenix_language';

// ─── Translations ────────────────────────────────────────────────────────────

export const translations = {
    // ── Login Page ──────────────────────────────────────────────────────────
    login: {
        title: {
            en: 'PROJECT MANAGEMENT',
            vi: 'QUẢN LÝ DỰ ÁN',
        },
        heading: {
            en: 'Sign In',
            vi: 'Đăng nhập',
        },
        email: {
            en: 'Email',
            vi: 'Email',
        },
        emailPlaceholder: {
            en: 'admin@zfenix.com',
            vi: 'admin@zfenix.com',
        },
        password: {
            en: 'Password',
            vi: 'Mật khẩu',
        },
        passwordPlaceholder: {
            en: '••••••••',
            vi: '••••••••',
        },
        rememberMe: {
            en: 'Remember me',
            vi: 'Ghi nhớ đăng nhập',
        },
        forgotPassword: {
            en: 'Forgot password?',
            vi: 'Quên mật khẩu?',
        },
        signIn: {
            en: 'Sign In',
            vi: 'Đăng nhập',
        },
        signingIn: {
            en: 'Signing in...',
            vi: 'Đang đăng nhập...',
        },
        orEmail: {
            en: 'Or continue with email',
            vi: 'Hoặc dùng email',
        },
        copyright: {
            en: 'Trustworthy Pinnacle',
            vi: 'Đỉnh cao đáng tin cậy',
        },
        // Errors
        errorPending: {
            en: 'Your account is pending admin approval. Please try again later.',
            vi: 'Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng quay lại sau.',
        },
        errorSuspended: {
            en: 'Your account has been suspended. Please contact the administrator.',
            vi: 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên.',
        },
        errorLinked: {
            en: 'This email is already used with a different sign-in method.',
            vi: 'Email này đã được sử dụng với một phương thức đăng nhập khác.',
        },
        errorSocial: {
            en: 'An error occurred while signing in with a social account.',
            vi: 'Có lỗi xảy ra khi đăng nhập bằng tài khoản mạng xã hội.',
        },
        errorGoogle: {
            en: 'Google sign-in failed. Please try again or contact the administrator.',
            vi: 'Đăng nhập Google thất bại. Vui lòng thử lại hoặc liên hệ quản trị viên.',
        },
        errorMicrosoft: {
            en: 'Microsoft sign-in failed. Please try again or contact the administrator.',
            vi: 'Đăng nhập Microsoft thất bại. Vui lòng thử lại hoặc liên hệ quản trị viên.',
        },
        errorCreateAccount: {
            en: 'Could not create account from social sign-in. Please contact the administrator.',
            vi: 'Không thể tạo tài khoản từ đăng nhập mạng xã hội. Vui lòng liên hệ quản trị viên.',
        },
        errorCallback: {
            en: 'Sign-in processing error. Please try again.',
            vi: 'Lỗi xử lý đăng nhập. Vui lòng thử lại.',
        },
        errorGeneral: {
            en: 'Sign-in failed. Please try again or use another method.',
            vi: 'Đăng nhập thất bại. Vui lòng thử lại hoặc sử dụng phương thức khác.',
        },
        errorCredentials: {
            en: 'Incorrect email or password. Please check and try again.',
            vi: 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
        },
        errorAuthConfig: {
            en: 'Authentication configuration error. Please contact the administrator.',
            vi: 'Lỗi cấu hình authentication. Vui lòng liên hệ quản trị viên.',
        },
        errorFailed: {
            en: 'Sign-in failed. Please try again.',
            vi: 'Đăng nhập thất bại. Vui lòng thử lại.',
        },
        errorSocialInit: {
            en: 'Could not initiate social sign-in.',
            vi: 'Không thể khởi tạo đăng nhập mạng xã hội.',
        },
    },

    // ── Settings Page ────────────────────────────────────────────────────────
    settings: {
        language: {
            en: 'Language',
            vi: 'Ngôn ngữ',
        },
        languageDesc: {
            en: 'Choose the interface language for the application',
            vi: 'Chọn ngôn ngữ hiển thị giao diện',
        },
        languageSection: {
            en: '🌐 Language & Region',
            vi: '🌐 Ngôn ngữ & Khu vực',
        },
        save: {
            en: 'Save Settings',
            vi: 'Lưu Cài đặt',
        },
        saving: {
            en: 'Saving...',
            vi: 'Đang lưu...',
        },
        saved: {
            en: 'Saved',
            vi: 'Đã lưu',
        },
        error: {
            en: 'Error',
            vi: 'Lỗi',
        },
    },

    // ── Common ───────────────────────────────────────────────────────────────
    common: {
        loading: {
            en: 'Loading...',
            vi: 'Đang tải...',
        },
    },
} as const;

// ─── Helper Function ──────────────────────────────────────────────────────────

type TranslationLeaf = { en: string; vi: string };
type TranslationNode = { [key: string]: TranslationLeaf | TranslationNode };

export function t(
    section: keyof typeof translations,
    key: string,
    lang: Language
): string {
    const node = (translations[section] as TranslationNode)[key];
    if (!node) return key;
    if (typeof node === 'object' && 'en' in node && 'vi' in node) {
        return (node as TranslationLeaf)[lang] ?? (node as TranslationLeaf)['en'];
    }
    return key;
}

// ─── Language Utilities ───────────────────────────────────────────────────────

export function getStoredLanguage(): Language {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    return stored && ['en', 'vi'].includes(stored) ? stored : DEFAULT_LANGUAGE;
}

export function setStoredLanguage(lang: Language): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));
}

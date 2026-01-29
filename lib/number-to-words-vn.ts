/**
 * Convert number to Vietnamese words
 * Example: 10000000 → "Mười triệu đồng chẵn"
 */

const ones = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
const teens = ["mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm", "mười sáu", "mười bảy", "mười tám", "mười chín"];
const tens = ["", "", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];

function convertLessThanThousand(num: number): string {
    if (num === 0) return "";

    let result = "";

    // Hundreds
    if (num >= 100) {
        result += ones[Math.floor(num / 100)] + " trăm";
        num %= 100;

        if (num > 0 && num < 10) {
            result += " lẻ";
        }
    }

    // Tens and ones
    if (num >= 20) {
        result += " " + tens[Math.floor(num / 10)];
        num %= 10;
        if (num > 0) {
            if (num === 1) {
                result += " mốt";
            } else if (num === 5) {
                result += " lăm";
            } else {
                result += " " + ones[num];
            }
        }
    } else if (num >= 10) {
        result += " " + teens[num - 10];
    } else if (num > 0) {
        result += " " + ones[num];
    }

    return result.trim();
}

export function numberToVietnameseWords(num: number): string {
    if (num === 0) return "Không đồng";
    if (num < 0) return "Số âm không hợp lệ";

    // Round to nearest integer
    num = Math.round(num);

    const billion = Math.floor(num / 1000000000);
    num %= 1000000000;
    const million = Math.floor(num / 1000000);
    num %= 1000000;
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;

    let result = "";

    if (billion > 0) {
        result += convertLessThanThousand(billion) + " tỷ";
    }

    if (million > 0) {
        result += " " + convertLessThanThousand(million) + " triệu";
    }

    if (thousand > 0) {
        result += " " + convertLessThanThousand(thousand) + " nghìn";
    }

    if (remainder > 0) {
        result += " " + convertLessThanThousand(remainder);
    }

    result = result.trim();

    // Capitalize first letter
    result = result.charAt(0).toUpperCase() + result.slice(1);

    // Add " đồng chẵn" at the end
    return result + " đồng chẵn";
}

/**
 * Format number as Vietnamese currency
 * Example: 10000000 → "10,000,000"
 */
export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}

/**
 * Format number as VND with symbol
 * Example: 10000000 → "10,000,000 ₫"
 */
export function formatVNDWithSymbol(amount: number): string {
    return formatVND(amount) + " ₫";
}

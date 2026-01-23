
function parseColorToRgba(color, alpha) {
    if (!color) return null;
    
    const cleanColor = String(color).trim();
    
    // Handle RGB/RGBA
    if (cleanColor.toLowerCase().startsWith('rgb')) {
        const matches = cleanColor.match(/[\d.]+/g);
        if (matches && matches.length >= 3) {
            const [r, g, b] = matches;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return null;
    }

    // Handle Decimal String (e.g. "16711680") or raw number
    if (/^-?\d+$/.test(cleanColor) && !cleanColor.startsWith('0x')) {
        let num = parseInt(cleanColor, 10);
        
        if (num < 0) {
            num = num >>> 0;
        }

        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Handle Hex
    if (cleanColor.startsWith('#')) {
        const hex = cleanColor.slice(1);
        let r, g, b;
        
        if (hex.length === 3 || hex.length === 4) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6 || hex.length === 8) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            return null;
        }

        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
    }
    
    return null;
}

const testColors = [
    { name: "Purple Int (Signed)", value: -8388480 },
    { name: "Purple Int (Unsigned)", value: 4286578816 },
    { name: "Purple Hex", value: "#800080" },
    { name: "Purple Hex No Hash", value: "800080" },
    { name: "Cyan Int", value: -16711681 }, 
    { name: "Zero", value: 0 },
    { name: "String Int", value: "-8388480" }
];

testColors.forEach(c => {
    console.log(`${c.name}: ${c.value} -> ${parseColorToRgba(c.value, 1)}`);
});

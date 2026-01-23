
import { parseColorToRgba } from './launcher/frontend/src/lib/utils';

const testColors = [
    { name: "Purple Int (Signed)", value: -8388480 },
    { name: "Purple Int (Unsigned)", value: 4286578816 },
    { name: "Purple Hex", value: "#800080" },
    { name: "Purple Hex No Hash", value: "800080" },
    { name: "Cyan Int", value: -16711681 }, // 0xFF00FFFF
    { name: "Zero", value: 0 },
    { name: "String Int", value: "-8388480" }
];

testColors.forEach(c => {
    console.log(`${c.name}: ${c.value} -> ${parseColorToRgba(c.value, 1)}`);
});

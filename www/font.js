var baseCharSizes = null;
var fontTexture = null;
var fontWidth, fontHeight;
var fontCharHeight = 8;

function loadFont(client) {
    fontTexture = initTexture("font.png", function(texture) {
        var img = texture.image;
        var canvas = document.createElement("canvas");
        canvas.width = fontWidth = img.width;
        canvas.height = fontHeight = img.height;
        var context = canvas.getContext("2d");
        context.drawImage(img, 0, 0);
        var data = context.getImageData(0, 0, img.width, img.height).data;
        baseCharSizes = [];
        for(var y = 0; y < 16; y++) {
            for(var x = 0; x < 16; x++) {
                var ix;
                for(ix = 0; ix < 8; ix++) {
                    var found = false;
                    for(var iy = 0; iy < 8; iy++) {
                        if(data[((y * 8 + iy) * 128 + x * 8 + ix) * 4 + 3] > 0) {
                            found = true;
                            break;
                        }
                    }
                    if(!found) break;
                }
                baseCharSizes[y * 16 + x] = ix;
            }
        }
        baseCharSizes[32] = 3;
        client.onFontLoaded();
    });
}

function buildFont(varr, tarr, carr, x, y, z, s, text, r, g, b, a, cm) {
    var or = r,
        og = g,
        ob = b;
    if(cm == null) cm = 1; // color multiplier
    r *= cm;
    g *= cm;
    b *= cm;
    var bold = false;
    var italic = false;
    var strike = -1;
    var underline = -1;
    if(baseCharSizes == null) return;
    var _x = x;
    var mWidth = 0;

    function resetFormatting() {
        bold = false;
        italic = false;
        if(underline != -1) {
            var x1 = underline;
            var x2 = x - 1;
            var y1 = y - s;
            var y2 = y;
            varr.push(x2, y2, 0, x1, y2, 0, x2, y1, 0, x1, y2, 0, x1, y1, 0, x2, y1, 0);
            var texX1 = 89;
            var texY1 = 105;
            var texX2 = 90;
            var texY2 = 106;
            tarr.push(texX2 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX2 / fontWidth, texY2 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY2 / fontHeight, texX2 / fontWidth, texY2 / fontHeight);
            carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
            carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
            underline = -1;
        }
        if(strike != -1) {
            var x1 = strike;
            var x2 = x;
            var y1 = y + fontCharHeight / 2;
            var y2 = y1 + 1;
            varr.push(x2, y2, 0, x1, y2, 0, x2, y1, 0, x1, y2, 0, x1, y1, 0, x2, y1, 0);
            var texX1 = 89;
            var texY1 = 105;
            var texX2 = 90;
            var texY2 = 106;
            tarr.push(texX2 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX2 / fontWidth, texY2 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY2 / fontHeight, texX2 / fontWidth, texY2 / fontHeight);
            carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
            carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
            strike = -1;
        }

        r = or * cm;
        g = og * cm;
        b = ob * cm;
    }

    for(var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i);
        if(c == 167) {
            // formatting
            i++;
            var n = text.charAt(i);
            if(n == "0") {
                r = 0;
                g = 0;
                b = 0;
            } else if(n == "1") {
                r = 0;
                g = 0;
                b = 0.66;
            } else if(n == "2") {
                r = 0;
                g = 0.66;
                b = 0;
            } else if(n == "3") {
                r = 0;
                g = 0.66;
                b = 0.66;
            } else if(n == "4") {
                r = 0.66;
                g = 0;
                b = 0;
            } else if(n == "5") {
                r = 0.66;
                g = 0;
                b = 0.66;
            } else if(n == "6") {
                r = 1;
                g = 0.66;
                b = 0;
            } else if(n == "7") {
                r = 0.66;
                g = 0.66;
                b = 0.66;
            } else if(n == "8") {
                r = 0.33;
                g = 0.33;
                b = 0.33;
            } else if(n == "9") {
                r = 0.33;
                g = 0.33;
                b = 1;
            } else if(n == "a") {
                r = 0.33;
                g = 1;
                b = 0.33;
            } else if(n == "b") {
                r = 0.33;
                g = 1;
                b = 1;
            } else if(n == "c") {
                r = 1;
                g = 0.33;
                b = 0.33;
            } else if(n == "d") {
                r = 1;
                g = 0.33;
                b = 1;
            } else if(n == "e") {
                r = 1;
                g = 1;
                b = 0.33;
            } else if(n == "f") {
                r = 1;
                g = 1;
                b = 1;
            } else if(n == "k") {
                // obfuscated; not implementing
                continue;
            } else if(n == "l") {
                bold = true;
                continue;
            } else if(n == "m") {
                strike = x;
                continue;
            } else if(n == "n") {
                underline = x;
                continue;
            } else if(n == "o") {
                italic = true;
                continue;
            } else if(n == "r") {
                resetFormatting();
                continue;
            } else {
                continue;
            }
            r *= cm;
            g *= cm;
            b *= cm;
            continue;
        } else if(c == 10) { // new line
            var lWidth = (x - _x);
            if(lWidth > mWidth) {
                mWidth = lWidth;
            }
            x = _x;
            y -= s * 10;
            continue;
        }
        if(c > baseCharSizes.length) continue;
        var w = baseCharSizes[c];
        var dw = w * s;
        //if(bold) dw *= 2;
        var x1 = x;
        var y1 = y;
        var x2 = x + dw;
        var y2 = y + fontCharHeight * s;
        if(italic) {
            varr.push(x2 + s * 2, y2, 0, x1 + s * 2, y2, 0, x2, y1, 0, x1 + s * 2, y2, 0, x1, y1, 0, x2, y1, 0);
            if(bold) {
                x++;
                x1++;
                x2++;
                varr.push(x2 + s * 2, y2, 0, x1 + s * 2, y2, 0, x2, y1, 0, x1 + s * 2, y2, 0, x1, y1, 0, x2, y1, 0);
            }
        } else {
            varr.push(x2, y2, 0, x1, y2, 0, x2, y1, 0, x1, y2, 0, x1, y1, 0, x2, y1, 0);
            if(bold) {
                x++;
                x1++;
                x2++;
                varr.push(x2, y2, 0, x1, y2, 0, x2, y1, 0, x1, y2, 0, x1, y1, 0, x2, y1, 0);
            }
        }
        var texY1 = Math.floor(c / 16) * 8;
        var texX1 = (c % 16) * 8;
        var texX2 = texX1 + w;
        var texY2 = texY1 + 8;
        tarr.push(texX2 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX2 / fontWidth, texY2 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY2 / fontHeight, texX2 / fontWidth, texY2 / fontHeight);
        if(bold) {
            tarr.push(texX2 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX2 / fontWidth, texY2 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY2 / fontHeight, texX2 / fontWidth, texY2 / fontHeight);
        }
        if(carr != null) {
            carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
            carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
            if(bold) {
                carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
                carr.push(r, g, b, a, r, g, b, a, r, g, b, a);
            }
        }
        x += dw + s;
    }

    resetFormatting();
    var lWidth = (x - _x);
    if(lWidth > mWidth) {
        mWidth = lWidth;
    }
    return mWidth;
}

function buildFontShadow(varr, tarr, carr, x, y, z, s, text, r, g, b, a) {
    buildFont(varr, tarr, carr, x + s, y - s, z, s, text, r, g, b, a, 0.5);
    return buildFont(varr, tarr, carr, x, y, z, s, text, r, g, b, a);
}
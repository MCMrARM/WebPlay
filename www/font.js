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
    if(cm == null) cm = 1; // color multiplier
    r *= cm;
    g *= cm;
    b *= cm;
    if(baseCharSizes == null) return;
    var _x = x;
    for(var i = 0; i < text.length; i++) {
        var c = text.charCodeAt(i);
        if(c == 167) {
            // color
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
            } else {
                continue;
            }
            r *= cm;
            g *= cm;
            b *= cm;
            continue;
        }
        if(c > baseCharSizes.length) continue;
        var w = baseCharSizes[c];
        var x1 = x;
        var y1 = y;
        var x2 = x + w * s;
        var y2 = y + fontCharHeight * s;
        varr.push(x2, y2, 0, x1, y2, 0, x2, y1, 0, x1, y2, 0, x1, y1, 0, x2, y1, 0);
        var texY1 = Math.floor(c / 16) * 8;
        var texX1 = (c % 16) * 8;
        var texX2 = texX1 + w;
        var texY2 = texY1 + 8;
        tarr.push(texX2 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX2 / fontWidth, texY2 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY2 / fontHeight, texX2 / fontWidth, texY2 / fontHeight);
        if(carr != null) {
            carr.push(r, g, b, a);
            carr.push(r, g, b, a);
            carr.push(r, g, b, a);
            carr.push(r, g, b, a);
            carr.push(r, g, b, a);
            carr.push(r, g, b, a);
        }
        x += (w + 1) * s;
    }
    return(x - _x);
}

function buildFontShadow(varr, tarr, carr, x, y, z, s, text, r, g, b, a) {
    buildFont(varr, tarr, carr, x + s, y - s, z, s, text, r, g, b, a, 0.5);
    return buildFont(varr, tarr, carr, x, y, z, s, text, r, g, b, a);
}
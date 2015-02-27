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
						if(data[((y*8+iy)*128+x*8+ix)*4+3] > 0) {
							found = true;
							break;
						}
					}
					if(!found) break;
				}
				baseCharSizes[y*16+x] = ix;
			}
		}
		client.onFontLoaded();
	});
}

function buildFont(varr, tarr, carr, x, y, z, s, text, r, g, b, a) {
	if(baseCharSizes == null) return;
	var _x = x;
	for(var i = 0; i < text.length; i++) {
		var c = text.charCodeAt(i);
		if(c > baseCharSizes.length) continue;
		var w = baseCharSizes[c];
		var x1 = x;
		var y1 = y;
		var x2 = x+w*s;
		var y2 = y+fontCharHeight*s;
		varr.push(x2, y2, 0, x1, y2, 0, x2, y1, 0, x1, y2, 0, x1, y1, 0, x2, y1, 0);
		var texY1 = Math.floor(c / 16) * 8;
		var texX1 = (c % 16) * 8;
		var texX2 = texX1 + w;
		var texY2 = texY1 + 8;
		tarr.push(texX2/fontWidth, texY1/fontHeight, texX1/fontWidth, texY1/fontHeight, texX2/fontWidth, texY2/fontHeight, texX1/fontWidth, texY1/fontHeight, texX1/fontWidth, texY2/fontHeight, texX2/fontWidth, texY2/fontHeight);
		if(carr != null) {
			carr.push(r, g, b, a);
			carr.push(r, g, b, a);
			carr.push(r, g, b, a);
			carr.push(r, g, b, a);
			carr.push(r, g, b, a);
			carr.push(r, g, b, a);
		}
		x += (w+1)*s;
	}
	return (x - _x);
}

function buildFontShadow(varr, tarr, carr, x, y, z, s, text, r, g, b, a) {
	buildFont(varr, tarr, carr, x+s, y-s, z, s, text, r/2, g/2, b/2, a);
	return buildFont(varr, tarr, carr, x, y, z, s, text, r, g, b, a);
}
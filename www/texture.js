var textures = [];

var TEXTURE_PATH = "img/";

var TEXTURE_OFFSET = 0.0001;

function addTextureOffset(tex) {
    if(tex[0] < tex[2]) {
        tex[0] += TEXTURE_OFFSET;
        tex[2] -= TEXTURE_OFFSET;
    } else {
        tex[0] -= TEXTURE_OFFSET;
        tex[2] += TEXTURE_OFFSET;
    }

    if(tex[1] < tex[3]) {
        tex[1] += TEXTURE_OFFSET;
        tex[3] -= TEXTURE_OFFSET;
    } else {
        tex[1] -= TEXTURE_OFFSET;
        tex[3] += TEXTURE_OFFSET;
    }
    return tex;
}

function initTexture(path, callback) {
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        if(callback != null) {
            callback(texture);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    texture.image.src = TEXTURE_PATH + path;
    textures.push(texture);
    return(textures.length - 1);
}
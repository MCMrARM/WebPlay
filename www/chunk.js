function Chunk() {
    this.blocks = new Array(16 * 16 * 16);

    this.setBlock = function(x, y, z, id, data) {
        if(id == null) {
            this.blocks[x * 16 * 16 + y * 16 + z] = null;
        } else {
            this.blocks[x * 16 * 16 + y * 16 + z] = [id, data];
        }
    }

    this.setBlockData = function(x, y, z, data) {
        if(this.blocks[x * 16 * 16 + y * 16 + z] != null) {
            this.blocks[x * 16 * 16 + y * 16 + z][1] = data;
        }
    }

    this.getBlock = function(x, y, z) {
        return this.blocks[x * 16 * 16 + y * 16 + z];
    }
}

function FullChunk() {
    this.chunks = [];
    this.biomeColors = null;
    this.built = null;
    this.builtTex = null;
    this.builtColor = null;
    this.entities = {};

    this.getChunk = function(y) {
        var c = this.chunks[y];
        if(c == null) {
            c = new Chunk();
            this.chunks[y] = c;
        }
        return c;
    }

    this.getBlock = function(x, y, z) {
        var i = y >> 4;
        var c = this.getChunk(i);
        return c.getBlock(x, y & 0xf, z);
    }

    this.setBlock = function(x, y, z, id, data) {
        var i = y >> 4;
        var c = this.getChunk(i);
        c.setBlock(x, y & 0xf, z, id, data);
    }

    this.deleteBuffers = function(gl) {
        if(this.built != null) {
            gl.deleteBuffer(this.built);
            this.built = null;
        }
        if(this.builtTex != null) {
            gl.deleteBuffer(this.builtTex);
            this.builtTex = null;
        }
        if(this.builtColor != null) {
            gl.deleteBuffer(this.builtColor);
            this.builtColor = null;
        }
    }

    this.rebuild = function(gl, shouldCreateBuffer) {
        if(shouldCreateBuffer) {
            this.deleteBuffers(gl);
        }
        var arr = [];
        var tarr = [];
        var carr = [];
        for(var i = 0; i < 8; i++) {
            var schunk = this.chunks[i];
            if(schunk != null) {
                for(var _z = 0; _z < 16; _z++) {
                    for(var _x = 0; _x < 16; _x++) {
                        //console.log("a: "+_x+" "+_z+"; "+this.biomeColors[_x*16+_z]);
                        for(var _y = 0; _y < 16; _y++) {
                            var block = schunk.getBlock(_x, _y, _z);
                            if(block == null) continue;
                            var bInst = getBlockById(block[0]);
                            var renderBottom = (_y <= 0 || (schunk.getBlock(_x, _y - 1, _z) == null || getBlockById(schunk.getBlock(_x, _y - 1, _z)).transparent) || bInst.transparent);
                            var renderTop = (_y >= 15 || (schunk.getBlock(_x, _y + 1, _z) == null || getBlockById(schunk.getBlock(_x, _y + 1, _z)).transparent) || bInst.transparent);
                            var renderBack = (_z <= 0 || (schunk.getBlock(_x, _y, _z - 1) == null || getBlockById(schunk.getBlock(_x, _y, _z - 1)).transparent) || bInst.transparent);
                            var renderFront = (_z >= 15 || (schunk.getBlock(_x, _y, _z + 1) == null || getBlockById(schunk.getBlock(_x, _y, _z + 1)).transparent) || bInst.transparent);
                            var renderLeft = (_x <= 0 || (schunk.getBlock(_x - 1, _y, _z) == null || getBlockById(schunk.getBlock(_x - 1, _y, _z)).transparent) || bInst.transparent);
                            var renderRight = (_x >= 15 || (schunk.getBlock(_x + 1, _y, _z) == null || getBlockById(schunk.getBlock(_x + 1, _y, _z)).transparent) || bInst.transparent);
                            buildBlock(arr, tarr, carr, _x, i * 16 + _y, _z, 1, bInst, block[1], renderBottom, renderTop, renderBack, renderFront, renderLeft, renderRight, this);
                        }
                    }
                }
            }
        }

        if(shouldCreateBuffer) {
            this.built = createBuffer(arr, 3, gl.STATIC_DRAW);
            this.builtTex = createBuffer(tarr, 2, gl.STATIC_DRAW);
            this.builtColor = createBuffer(carr, 4, gl.STATIC_DRAW);
        }
        return [arr, tarr, carr];
    }
}
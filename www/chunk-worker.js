importScripts('utils.js');
importScripts('pako.js');
importScripts('texture.js');
importScripts('blocks.js');
importScripts('chunk.js');

self.addEventListener('message', function(e) {
    if(e.data.action == 0) { // unpack chunk
        var chunk = new FullChunk();
        var data = pako.inflate(new Uint8Array(e.data.data, 1));
        var off = 0;
        var pos = new Int32Array(data.buffer.slice(0, 8));
        var chunkX = pos[0];
        var chunkZ = pos[1];
        chunk.chunks = [];
        off += 8;
        for(var x = 0; x < 16; x++) {
            for(var z = 0; z < 16; z++) {
                for(var cy = 0; cy < 8; cy++) {
                    var sc = chunk.chunks[cy];
                    if(sc == null) {
                        sc = new Chunk();
                        chunk.chunks[cy] = sc;
                    }
                    for(var y = 0; y < 16; y++) {
                        if(data[off] != 0) {
                            sc.setBlock(x, y, z, data[off], 0);
                        }
                        off++;
                    }
                }
            }
        }
        for(var x = 0; x < 16; x++) {
            for(var z = 0; z < 16; z++) {
                for(var cy = 0; cy < 8; cy++) {
                    var sc = chunk.chunks[cy];
                    for(var y = 0; y < 16; y += 2) {
                        sc.setBlockData(x, y, z, data[off] & 0x0f);
                        sc.setBlockData(x, y + 1, z, (data[off] >> 4) & 0x0f);
                        off++;
                    }
                }
            }
        }
        off += 16 * 16 * 128 / 2; // skylight
        off += 16 * 16 * 128 / 2; // light
        off += 256; // biome ids
        chunk.biomeColors = new Int32Array(data.buffer.slice(off, off + 256 * 4));

        var built = chunk.rebuild(null, false);
        var chunks = [];
        for(var i = 0; i < 8; i++) {
            chunks[i] = chunk.chunks[i].blocks;
        }
        self.postMessage({
            "action": 0,
            "chunkX": chunkX,
            "chunkZ": chunkZ,
            "chunks": chunks,
            "biomeColors": chunk.biomeColors,
            "built": built
        });
    }
}, false);
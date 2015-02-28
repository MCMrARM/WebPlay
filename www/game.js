var gl = null;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var translation;

function Client() {
    var FRAGMENT_SHADER =
        "precision mediump float;\n" +
        "uniform vec4 uFragmentColor;\n" +
        "varying vec2 vTextureCoord;\n" +
        "varying vec4 vColor;\n" +
        "uniform sampler2D uSampler;\n" +
        "void main() {\n" +
        //" gl_FragColor = uFragmentColor;\n" +
        " gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) * vColor * uFragmentColor;\n" +
        "}";

    var VERTEX_SHADER =
        "attribute vec3 aVertexPosition;\n" +
        "attribute vec2 aTextureCoord;\n" +
        "attribute vec4 aColor;\n" +
        "uniform mat4 uMVMatrix;\n" +
        "uniform mat4 uPMatrix;\n" +
        "varying vec2 vTextureCoord;\n" +
        "varying vec4 vColor;\n" +
        "void main() {\n" +
        " gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
        " vTextureCoord = aTextureCoord;\n" +
        " vColor = aColor;\n" +
        "}";

    var ENTITY_FRAGMENT_SHADER =
        "precision mediump float;\n" +
        "uniform vec4 uFragmentColor;\n" +
        "varying vec2 vTextureCoord;\n" +
        "uniform sampler2D uSampler;\n" +
        "void main() {\n" +
        " gl_FragColor.rgb = mix(texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)), uFragmentColor, uFragmentColor.a).rgb;\n" +
        " gl_FragColor.a = 1.0;\n" +
        "}";

    var ENTITY_VERTEX_SHADER =
        "attribute vec3 aVertexPosition;\n" +
        "attribute vec2 aTextureCoord;\n" +
        "uniform mat4 uMVMatrix;\n" +
        "uniform mat4 uPMatrix;\n" +
        "varying vec2 vTextureCoord;\n" +
        "void main() {\n" +
        " gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
        " vTextureCoord = aTextureCoord;\n" +
        "}";

    var GUI_FRAGMENT_SHADER =
        "precision mediump float;\n" +
        "varying vec2 vTextureCoord;\n" +
        "uniform sampler2D uSampler;\n" +
        "void main() {\n" +
        " gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n" +
        "}";

    var GUI_VERTEX_SHADER =
        "attribute vec3 aVertexPosition;\n" +
        "attribute vec2 aTextureCoord;\n" +
        "uniform mat4 uMVMatrix;\n" +
        "uniform mat4 uPMatrix;\n" +
        "varying vec2 vTextureCoord;\n" +
        "void main() {\n" +
        " gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
        " vTextureCoord = aTextureCoord;\n" +
        "}";

    this.chunks = {};
    this.entities = {};

    this.canvas = null;
    this.mainShader = null;
    this.entityShader = null;
    this.guiShader = null;

    this.networkHandler = null;

    this.onGround = false;

    var walkSpeed = 0.21585;
    var yAxisSpeed = 0.6;
    this.posX = 0;
    this.posY = 6;
    this.posZ = 0;
    this.motionX = 0;
    this.motionY = 0;
    this.motionZ = 0;
    this.yaw = 0;
    this.pitch = 0;

    this.guiScale = 2;
    this.ingameGui = null;

    this.resizeCallbacks = [];

    this.inventory = [];
    this.hotbar = [];
    this.selectedHotbarSlot = 0;

    var _this = this;
    this.chunkWorker = new Worker("chunk-worker.js");
    this.chunkWorker.addEventListener('message', function(e) {
        if(e.data.action == 0) {
            var fChunk = _this.getChunk(e.data.chunkX, e.data.chunkZ);
            if(fChunk == null) {
                fChunk = new FullChunk();
                _this.setChunk(e.data.chunkX, e.data.chunkZ, fChunk);
            }
            for(var i = 0; i < 8; i++) {
                var sc = new Chunk();
                sc.blocks = e.data.chunks[i];
                fChunk.chunks[i] = sc;
            }
            fChunk.biomeColors = e.data.biomeColors;
            fChunk.built = createBuffer(e.data.built[0], 3, gl.STATIC_DRAW);
            fChunk.builtTex = createBuffer(e.data.built[1], 2, gl.STATIC_DRAW);
            fChunk.builtColor = createBuffer(e.data.built[2], 4, gl.STATIC_DRAW);
        }
    }, false);

    this.setChunk = function(x, z, chunk) {
        if(this.chunks[x] == null) {
            this.chunks[x] = {};
        }
        this.chunks[x][z] = chunk;
        return chunk;
    }

    this.getChunk = function(x, z) {
        if(this.chunks[x] == null) {
            return null;
        }
        return this.chunks[x][z];
    }

    this.getBlock = function(x, y, z) {
        var cx = x >> 4;
        var cz = z >> 4;
        var c = this.getChunk(cx, cz);
        if(c == null) return null;
        return c.getBlock(x & 0xf, y, z & 0xf);
    }

    this.setBlock = function(x, y, z, id, data) {
        var cx = x >> 4;
        var cz = z >> 4;
        var c = this.getChunk(cx, cz);
        if(c == null) return null;
        c.setBlock(x & 0xf, y, z & 0xf, id, data);
        c.rebuild(gl, true);
    }

    // Gets collision boxes for the blocks the player can eventually touch in any way
    this.getCollisionBoxes = function() {
        var boxes = [];
        var _this = this;

        function addBox(x, y, z) {
            var b = _this.getBlock(x, y, z);
            if(b == null) return;
            if(b[0] == 0) return;
            b = getBlockById(b);
            boxes.push([x + b.shape[0], y + b.shape[1], z + b.shape[2], x + b.shape[3], y + b.shape[4], z + b.shape[5]]);
        }
        var rX = Math.round(this.posX);
        var rY = Math.round(this.posY);
        var rZ = Math.round(this.posZ);

        for(var x = -2; x < 2; x++) {
            for(var y = -3; y < 3; y++) {
                for(var z = -2; z < 2; z++) {
                    addBox(rX + x, rY + y, rZ + z);
                }
            }
        }
        return boxes;
    }

    this.init = function() {
        this.canvas = document.getElementById("canvas");
        gl = this.canvas.getContext("experimental-webgl", {
            antialias: false
        });
        gl.viewportWidth = this.canvas.width;
        gl.viewportHeight = this.canvas.height;

        this.mainShader = linkProgram(FRAGMENT_SHADER, VERTEX_SHADER);
        this.mainShader.vertexPositionAttribute = gl.getAttribLocation(this.mainShader, "aVertexPosition");
        this.mainShader.textureCoordAttribute = gl.getAttribLocation(this.mainShader, "aTextureCoord");
        this.mainShader.colorAttribute = gl.getAttribLocation(this.mainShader, "aColor");
        this.mainShader.fragmentColorUniform = gl.getUniformLocation(this.mainShader, "uFragmentColor");
        this.mainShader.pMatrixUniform = gl.getUniformLocation(this.mainShader, "uPMatrix");
        this.mainShader.mvMatrixUniform = gl.getUniformLocation(this.mainShader, "uMVMatrix");
        this.mainShader.samplerUniform = gl.getUniformLocation(this.mainShader, "uSampler");

        this.entityShader = linkProgram(ENTITY_FRAGMENT_SHADER, ENTITY_VERTEX_SHADER);
        this.entityShader.vertexPositionAttribute = gl.getAttribLocation(this.entityShader, "aVertexPosition");
        this.entityShader.textureCoordAttribute = gl.getAttribLocation(this.entityShader, "aTextureCoord");
        this.entityShader.pMatrixUniform = gl.getUniformLocation(this.entityShader, "uPMatrix");
        this.entityShader.mvMatrixUniform = gl.getUniformLocation(this.entityShader, "uMVMatrix");
        this.entityShader.fragmentColor = gl.getUniformLocation(this.entityShader, "uFragmentColor");
        this.entityShader.samplerUniform = gl.getUniformLocation(this.entityShader, "uSampler");
        /*
        this.guiShader = linkProgram(GUI_FRAGMENT_SHADER, GUI_VERTEX_SHADER);
        this.guiShader.vertexPositionAttribute = gl.getAttribLocation(this.guiShader, "aVertexPosition");
        this.guiShader.textureCoordAttribute = gl.getAttribLocation(this.guiShader, "aTextureCoord");
        this.guiShader.pMatrixUniform = gl.getUniformLocation(this.guiShader, "uPMatrix");
        this.guiShader.mvMatrixUniform = gl.getUniformLocation(this.guiShader, "uMVMatrix");
        this.guiShader.samplerUniform = gl.getUniformLocation(this.guiShader, "uSampler");
		*/
        gl.clearColor(173 / 255, 210 / 255, 1.0, 1.0);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);

        this.whiteTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

        this.terrainTexture = initTexture("terrain.png");
        this.itemsTexture = initTexture("items.png");
        this.guiTexture = initTexture("gui.png");
        this.playerTexture = initTexture("char.png");

        loadFont(this);
    }

    this.onFontLoaded = function() { // font is required by the ingame gui
        this.networkHandler = new NetworkHandler(this, "ws://localhost:8000/minecraft");
        this.ingameGui = new IngameGui(this);
        this.draw();
        window.setInterval(this.tick.bind(this), 50);
    }

    var lastTickTime = 0;
    this.pposX = 6;
    this.pposY = 4;
    this.pposZ = 0;
    this.pyaw = 0;
    this.ppitch = 0;
    var ptime = new Date().getTime();
    this.viewAngle = 45;

    this.draw = function() {
        var currentTime = new Date().getTime();
        var deltaTime = currentTime - ptime;
        ptime = currentTime;

        var m = (currentTime - lastTickTime) / 50;
        if(m > 1) m = 1;

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(pMatrix, this.viewAngle, gl.viewportWidth / gl.viewportHeight, 0.1, 300.0);

        mat4.identity(mvMatrix);

        translation = vec3.create();
        mat4.rotateX(mvMatrix, mvMatrix, this.ppitch + (this.pitch - this.ppitch) * m);
        mat4.rotateY(mvMatrix, mvMatrix, this.pyaw + (this.yaw - this.pyaw) * m);
        vec3.set(translation, -(this.pposX + (this.posX - this.pposX) * m), -(this.pposY + (this.posY - this.pposY) * m), -(this.pposZ + (this.posZ - this.pposZ) * m));
        mat4.translate(mvMatrix, mvMatrix, translation);

        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(this.mainShader);
        gl.enableVertexAttribArray(this.mainShader.vertexPositionAttribute);
        gl.enableVertexAttribArray(this.mainShader.textureCoordAttribute);
        gl.enableVertexAttribArray(this.mainShader.colorAttribute);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[this.terrainTexture]);
        gl.uniform1i(this.mainShader.samplerUniform, 0);
        gl.uniform4f(this.mainShader.fragmentColorUniform, 1, 1, 1, 1);

        var arr = [];
        for(var x in this.chunks) {
            if(!this.chunks.hasOwnProperty(x)) continue;
            var schunks = this.chunks[x];
            for(var z in schunks) {
                if(!schunks.hasOwnProperty(z)) continue;
                var chunk = schunks[z];

                vec3.set(translation, x * 16, 0, z * 16);
                mat4.translate(mvMatrix, mvMatrix, translation)

                if(chunk.built != null && chunk.builtColor != null && chunk.builtTex != null) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, chunk.builtColor);
                    gl.vertexAttribPointer(this.mainShader.colorAttribute, chunk.builtColor.entnum, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, chunk.builtTex);
                    gl.vertexAttribPointer(this.mainShader.textureCoordAttribute, chunk.builtTex.entnum, gl.FLOAT, false, 0, 0);

                    drawArray(chunk.built, gl.TRIANGLES, this.mainShader);
                }

                vec3.set(translation, -x * 16, 0, -z * 16);
                mat4.translate(mvMatrix, mvMatrix, translation);
            }
        }

        gl.disableVertexAttribArray(this.mainShader.vertexPositionAttribute);
        gl.disableVertexAttribArray(this.mainShader.textureCoordAttribute);
        gl.disableVertexAttribArray(this.mainShader.colorAttribute);

        gl.enableVertexAttribArray(this.entityShader.vertexPositionAttribute);
        gl.enableVertexAttribArray(this.entityShader.textureCoordAttribute);
        gl.useProgram(this.entityShader);
        for(var entityId in this.entities) {
            if(!this.entities.hasOwnProperty(entityId)) continue;
            var entity = this.entities[entityId];
            entity.render(currentTime, deltaTime);
        }
        gl.disableVertexAttribArray(this.entityShader.vertexPositionAttribute);
        gl.disableVertexAttribArray(this.entityShader.textureCoordAttribute);

        gl.disable(gl.DEPTH_TEST);
        /*
        gl.enableVertexAttribArray(this.guiShader.vertexPositionAttribute);
        gl.enableVertexAttribArray(this.guiShader.textureCoordAttribute);
        gl.useProgram(this.guiShader);*/
        gl.useProgram(this.mainShader);
        gl.enableVertexAttribArray(this.mainShader.vertexPositionAttribute);
        gl.enableVertexAttribArray(this.mainShader.textureCoordAttribute);
        gl.enableVertexAttribArray(this.mainShader.colorAttribute);

        mat4.identity(mvMatrix);
        var guiWidth = gl.viewportWidth / this.guiScale;
        var guiHeight = gl.viewportHeight / this.guiScale;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[this.guiTexture]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[this.terrainTexture]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, textures[this.itemsTexture]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, textures[fontTexture]);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);

        gl.uniform1i(this.mainShader.samplerUniform, 0);
        mat4.ortho(pMatrix, 0, guiWidth, 0, guiHeight, 0.1, 100);

        vec3.set(translation, 0, 0, -1);
        mat4.translate(mvMatrix, mvMatrix, translation);

        this.ingameGui.render(this, 0, 0, currentTime);

        requestAnimationFrame(this.draw.bind(this));
    }

    this.move = function(dX, dY, dZ) {
        var c = this.getChunk((this.posX + dX) >> 4, (this.posZ + dZ) >> 4);
        if(c == null || c.built == null) return;
        if(dY < 0) {
            for(var y = this.posY - 1.62; y >= this.posY - 1.62 + dY - 1; y--) {
                var _x = Math.floor(this.posX);
                var _y = Math.floor(y);
                var _z = Math.floor(this.posZ);
                for(var x = _x - 1; x <= _x + 1; x++) {
                    for(var z = _z - 1; z <= _z + 1; z++) {
                        var b = _this.getBlock(x, _y, z);
                        if(b == null || b[0] == 0) continue;
                        b = getBlockById(b);
                        var box = b.shape;
                        //console.log((this.posY - 1.62)+" "+(this.posY + dY - 1.62)+" "+(_y + box[4]));
                        if(this.posX + 0.3 > x + box[0] && this.posX - 0.3 < x + box[3] &&
                            this.posY + dY - 1.62 <= _y + box[4] && this.posY - 1.62 >= _y + box[1] &&
                            this.posZ + 0.3 > z + box[2] && this.posZ - 0.3 < z + box[5]) {
                            this.posY = _y + box[4] + 1.62;
                            dY = 0;
                            if(this.motionY < 0) this.motionY = 0;
                            break;
                        }
                    }
                }
            }
        } else if(dY > 0) {
            for(var y = this.posY; y <= this.posY + dY + 1; y++) {
                var _x = Math.floor(this.posX);
                var _y = Math.floor(y);
                var _z = Math.floor(this.posZ);
                for(var x = _x - 1; x <= _x + 1; x++) {
                    for(var z = _z - 1; z <= _z + 1; z++) {
                        var b = _this.getBlock(x, _y, z);
                        if(b == null || b[0] == 0) continue;
                        b = getBlockById(b);
                        var box = b.shape;
                        //console.log((this.posY - 1.62)+" "+(this.posY + dY - 1.62)+" "+(_y + box[4]));
                        if(this.posX + 0.3 > x + box[0] && this.posX - 0.3 < x + box[3] &&
                            this.posY + dY - 0.1 >= _y + box[1] && this.posY - 0.1 <= _y + box[4] &&
                            this.posZ + 0.3 > z + box[2] && this.posZ - 0.3 < z + box[5]) {
                            this.posY = _y + box[1] - 0.1;
                            dY = 0;
                            if(this.motionY > 0) this.motionY = 0;
                            break;
                        }
                    }
                }
            }
        }
        this.posY += dY;

        if(dX < 0) {
            for(var x = this.posX; x >= this.posX + dX - 1; x--) {
                var _x = Math.floor(x);
                var _y = Math.floor(this.posY - 1.62);
                var _z = Math.floor(this.posZ);
                for(var y = _y; y <= _y + 2; y++) {
                    for(var z = _z - 1; z <= _z + 1; z++) {
                        var b = _this.getBlock(_x, y, z);
                        if(b == null || b[0] == 0) continue;
                        b = getBlockById(b);
                        var box = b.shape;
                        if(this.posY > y + box[1] && this.posY - 1.62 < y + box[4] &&
                            this.posX - 0.3 + dX <= _x + box[3] && this.posX + 0.3 >= _x + box[0] &&
                            this.posZ + 0.3 > z + box[2] && this.posZ - 0.3 < z + box[5]) {
                            this.posX = _x + box[3] + 0.3;
                            dX = 0;
                            if(this.motionX < 0) this.motionX = 0;
                            break;
                        }
                    }
                }
            }
        } else if(dX > 0) {
            for(var x = this.posX; x <= this.posX + dX + 1; x++) {
                var _x = Math.floor(x);
                var _y = Math.floor(this.posY - 1.62);
                var _z = Math.floor(this.posZ);
                for(var y = _y; y <= _y + 2; y++) {
                    for(var z = _z - 1; z <= _z + 1; z++) {
                        var b = _this.getBlock(_x, y, z);
                        if(b == null || b[0] == 0) continue;
                        b = getBlockById(b);
                        var box = b.shape;
                        if(this.posY > y + box[1] && this.posY - 1.62 < y + box[4] &&
                            this.posX + 0.3 + dX >= _x + box[0] && this.posX - 0.3 <= _x + box[3] &&
                            this.posZ + 0.3 > z + box[2] && this.posZ - 0.3 < z + box[5]) {
                            this.posX = _x + box[0] - 0.3;
                            dX = 0;
                            if(this.motionX > 0) this.motionX = 0;
                            break;
                        }
                    }
                }
            }
        }
        this.posX += dX;

        if(dZ < 0) {
            for(var z = this.posZ; z >= this.posZ + dZ - 1; z--) {
                var _x = Math.floor(this.posX);
                var _y = Math.floor(this.posY - 1.62);
                var _z = Math.floor(z);
                for(var y = _y; y <= _y + 2; y++) {
                    for(var x = _x - 1; x <= _x + 1; x++) {
                        var b = _this.getBlock(x, y, _z);
                        if(b == null || b[0] == 0) continue;
                        b = getBlockById(b);
                        var box = b.shape;
                        if(this.posY > y + box[1] && this.posY - 1.62 < y + box[4] &&
                            this.posZ - 0.3 + dZ <= _z + box[5] && this.posZ + 0.3 >= _z + box[2] &&
                            this.posX + 0.3 > x + box[0] && this.posX - 0.3 < x + box[3]) {
                            this.posZ = _z + box[5] + 0.3;
                            dZ = 0;
                            if(this.motionZ < 0) this.motionZ = 0;
                            break;
                        }
                    }
                }
            }
        } else if(dZ > 0) {
            for(var z = this.posZ; z <= this.posZ + dZ + 1; z++) {
                var _x = Math.floor(this.posX);
                var _y = Math.floor(this.posY - 1.62);
                var _z = Math.floor(z);
                for(var y = _y; y <= _y + 2; y++) {
                    for(var x = _x - 1; x <= _x + 1; x++) {
                        var b = _this.getBlock(x, y, _z);
                        if(b == null || b[0] == 0) continue;
                        b = getBlockById(b);
                        var box = b.shape;
                        if(this.posY > y + box[1] && this.posY - 1.62 < y + box[4] &&
                            this.posZ + 0.3 + dZ >= _z + box[2] && this.posZ - 0.3 <= _z + box[5] &&
                            this.posX + 0.3 > x + box[0] && this.posX - 0.3 < x + box[3]) {
                            this.posZ = _z + box[2] - 0.3;
                            dZ = 0;
                            if(this.motionZ > 0) this.motionZ = 0;
                            break;
                        }
                    }
                }
            }
        }
        this.posZ += dZ;
    }

    var upPressed = false;
    var downPressed = false;
    var forwardPressed = false;
    var backPressed = false;
    var leftPressed = false;
    var rightPressed = false;
    var rotLeftPressed = false;
    var rotRightPressed = false;
    var jumpPressed = false;
    var rotSpeed = 0;
    var dYaw = 0;
    var dPitch = 0;
    this.tick = function() {
        var d = new Date().getTime() - lastTickTime;
        lastTickTime = new Date().getTime();

        var newCanvasWidth = window.innerWidth;
        var newCanvasHeight = window.innerHeight;
        if(this.canvas.width != newCanvasWidth || this.canvas.height != newCanvasHeight) {
            this.canvas.width = newCanvasWidth;
            this.canvas.height = newCanvasHeight;
            gl.viewportWidth = this.canvas.width;
            gl.viewportHeight = this.canvas.height;
            for(var i = 0; i < this.resizeCallbacks.length; i++) {
                this.resizeCallbacks[i](newCanvasWidth, newCanvasHeight);
            }
        }

        this.networkHandler.tick();

        this.pyaw = this.yaw;
        this.ppitch = this.pitch;
        this.pposX = this.posX;
        this.pposY = this.posY;
        this.pposZ = this.posZ;

        if(rotLeftPressed) {
            yaw -= rotSpeed;
            rotSpeed *= 1.2;
        } else if(rotRightPressed) {
            yaw += rotSpeed;
            rotSpeed *= 1.2;
        }

        if(dYaw != 0) {
            this.yaw += dYaw;
            this.yaw = this.yaw % (Math.PI * 2);
            dYaw = 0;
        }
        if(dPitch != 0) {
            this.pitch += dPitch;
            this.pitch = this.pitch % Math.PI;
            dPitch = 0;
        }

        if(upPressed) {
            this.posY += yAxisSpeed;
        } else if(downPressed) {
            this.posY -= yAxisSpeed;
        }

        this.motionX -= this.motionX * 0.1;
        this.motionZ -= this.motionZ * 0.1;
        this.motionY -= this.motionY * 0.02;
        this.motionY -= 0.08;

        if(this.motionY < 0 && this.onGround) {
            //this.motionY = 0;
        } else {
            //this.posY += this.motionY;
        }

        //this.posX += this.motionX;
        //this.posZ += this.motionZ;
        this.move(this.motionX, this.motionY, this.motionZ);


        this.onGround = false;

        var collisionBoxes = this.getCollisionBoxes();
        for(var i = 0; i < collisionBoxes.length; i++) {
            var box = collisionBoxes[i];
            if(this.posX >= box[0] && this.posX <= box[3] &&
                this.posY - 1.62 >= box[1] && this.posY - 1.62 <= box[4] &&
                this.posZ >= box[2] && this.posZ <= box[5]) {
                this.onGround = true;
            }
        }

        this.motionY *= 0.98;
        if(this.onGround) {
            this.motionX *= 0.6 * 0.91;
            this.motionZ *= 0.6 * 0.91;
        } else {
            this.motionX *= 0.91;
            this.motionZ *= 0.91;
        }

        if(forwardPressed) {
            //this.posZ -= Math.cos(this.yaw) * walkSpeed;
            //this.posX += Math.sin(this.yaw) * walkSpeed;
            this.move(Math.sin(this.yaw) * walkSpeed, 0, -Math.cos(this.yaw) * walkSpeed);
        } else if(backPressed) {
            //this.posZ += Math.cos(this.yaw) * walkSpeed;
            //this.posX -= Math.sin(this.yaw) * walkSpeed;
            this.move(-Math.sin(this.yaw) * walkSpeed, 0, Math.cos(this.yaw) * walkSpeed);
        } else if(leftPressed || rightPressed) {
            var v = this.yaw + (leftPressed ? -Math.PI : Math.PI) / 2;
            //this.posZ -= Math.cos(v) * walkSpeed;
            //this.posX += Math.sin(v) * walkSpeed;
            this.move(Math.sin(v) * walkSpeed, 0, -Math.cos(v) * walkSpeed);
        }

        if(jumpPressed) {
            if(_this.onGround)
                _this.motionY = 0.5; //0.42;
        }
    }

    this.setHotbarSlot = function(id) {
        this.selectedHotbarSlot = id;
        this.ingameGui.updateSelectedSlot();
        this.networkHandler.sendHeldItem(id);
    }

    this.linkHotbar = function(hotbarSlotId, slotId) {
        this.hotbar[hotbarSlotId] = slotId + 9;
        this.networkHandler.sendLinkHotbar(hotbarSlotId, slotId);
        this.ingameGui.updateHotbar();
    }

    this.init();

    function keydown(e) {
        var key = e.key || String.fromCharCode(e.which);
        if(key == null) return;
        key = key.toLowerCase();
        if(key == "w") {
            forwardPressed = true;
        } else if(key == "a") {
            leftPressed = true;
        } else if(key == "s") {
            backPressed = true;
        } else if(key == "d") {
            rightPressed = true;
        } else if(key == "c") {
            downPressed = true;
        } else if(key == "v") {
            upPressed = true;
        } else if(key == "z" && !rotLeftPressed) {
            rotLeftPressed = true;
            rotSpeed = 0.01;
        } else if(key == "x" && !rotRightPressed) {
            rotRightPressed = true;
            rotSpeed = 0.01;
        } else if(key == "1") {
            _this.setHotbarSlot(0);
        } else if(key == "2") {
            _this.setHotbarSlot(1);
        } else if(key == "3") {
            _this.setHotbarSlot(2);
        } else if(key == "4") {
            _this.setHotbarSlot(3);
        } else if(key == "5") {
            _this.setHotbarSlot(4);
        } else if(key == "6") {
            _this.setHotbarSlot(5);
        } else if(key == "7") {
            _this.setHotbarSlot(6);
        } else if(key == "8") {
            _this.setHotbarSlot(7);
        } else if(key == "9") {
            _this.setHotbarSlot(8);
        } else if(e.which == 32) {
            jumpPressed = true;
        } else if(key == "e") {
            _this.ingameGui.showInventory = !_this.ingameGui.showInventory;
        }
    };

    window.addEventListener("keydown", keydown, false);
    window.addEventListener("keypress", keydown, false);

    window.addEventListener("keyup", function(e) {
        var key = e.key || String.fromCharCode(e.which);
        if(key == null) return;
        key = key.toLowerCase();
        if(key == "w") {
            forwardPressed = false;
        } else if(key == "a") {
            leftPressed = false;
        } else if(key == "s") {
            backPressed = false;
        } else if(key == "d") {
            rightPressed = false;
        } else if(key == "c") {
            downPressed = false;
        } else if(key == "v") {
            upPressed = false;
        } else if(key == "z") {
            rotLeftPressed = false;
        } else if(key == "x") {
            rotRightPressed = false;
        } else if(e.which == 32) {
            jumpPressed = false;
        }
    }, false);

    var d = false;
    var lx = -1;
    var ly = -1;
    window.addEventListener("mousedown", function(e) {
        if(_this.ingameGui.showInventory) {
            var x = e.clientX / _this.guiScale;
            var y = (gl.viewportHeight - e.clientY) / _this.guiScale;
            console.log(x + " " + y);
            if(x >= 10 && y >= 3 && x <= 190 && y <= 63) {
                var itmX = Math.floor((x - 10) / 20);
                var itmY = Math.floor((y - 3) / 20);
                console.log(x + " " + y + " " + itmY + " " + itmX);
                _this.linkHotbar(_this.selectedHotbarSlot, itmY * 9 + itmX);
            }
        }

        console.log(e.button);
        if(e.button == 0) {
            lx = e.clientX;
            ly = e.clientY;
            d = true;
            return;
        }

        var hit = raycast(client, e.clientX, e.clientY);
        console.log(hit);
        if(hit == null) return;
        if(hit.isEntity && hit.distance <= 8) {
            console.log("Attack: " + hit.entity.id);
            _this.networkHandler.sendAttackPacket(hit.entity.id);
        }
        /*  else if(hit.isVirtual) {
        			console.log("Place block!");
        			//_this.setBlock(hit.x, hit.y, hit.z, 1, 0);
        		} */
        else {
            console.log("Place block!");
            _this.networkHandler.sendUseItem(hit.x, hit.y, hit.z, hit.side);
            /*
			if(hit.side == 2) {
				_this.setBlock(hit.x, hit.y, hit.z-1, 1, 0);
			} else if(hit.side == 3) {
				_this.setBlock(hit.x, hit.y, hit.z+1, 1, 0);
			} else if(hit.side == 4) {
				_this.setBlock(hit.x-1, hit.y, hit.z, 1, 0);
			} else if(hit.side == 5) {
				_this.setBlock(hit.x+1, hit.y, hit.z, 1, 0);
			} else if(hit.side == 0) {
				_this.setBlock(hit.x, hit.y-1, hit.z, 1, 0);
			} else if(hit.side == 1) {
				_this.setBlock(hit.x, hit.y+1, hit.z, 1, 0);
			}*/
        }
    }, true);
    window.addEventListener("mousemove", function(e) {
        if(d) {
            var dx = e.clientX - lx;
            var dy = e.clientY - ly;
            dYaw += dx / 100;
            dPitch += dy / 200;
            lx = e.clientX;
            ly = e.clientY;
        }
    }, true);
    window.addEventListener("mouseup", function(e) {
        d = false;
    }, true);

    this.sendMessage = function(text) {
        this.networkHandler.sendMessage(text);
    }
};

var client = new Client();
function Entity(id, chunk) {
    this.id = id;
    this.chunk = chunk;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.lastAttackTime = 0;
    this.name = null;

    this.render = function() {
        //
    }
    this.getAABB = function() {
        return [0, 0, 0, 0];
    }

    var nametagVertexBuilt = null;
    var nametagTextureBuilt = null;
    var nametagColorBuilt = null;
    var nametagWidth = 0;

    this.rebuildNametag = function() {
        if(nametagVertexBuilt != null) {
            gl.deleteBuffer(nametagVertexBuilt);
            nametagVertexBuilt = null;
        }
        if(nametagTextureBuilt != null) {
            gl.deleteBuffer(nametagTextureBuilt);
            nametagTextureBuilt = null;
        }
        if(nametagColorBuilt != null) {
            gl.deleteBuffer(nametagColorBuilt);
            nametagColorBuilt = null;
        }
        if(this.name == null) return;

        var varr = [];
        var tarr = [];
        var carr = [];

        nametagWidth = buildFont(varr, tarr, carr, 0, 0, 0, 1, this.name, 1, 1, 1, 1);

        varr.unshift(nametagWidth, 10, 0, 0, 10, 0, nametagWidth, 0, 0, 0, 10, 0, 0, 0, 0, nametagWidth, 0, 0);
        var texX1 = 89;
        var texY1 = 105;
        var texX2 = 90;
        var texY2 = 106;
        tarr.unshift(texX2 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX2 / fontWidth, texY2 / fontHeight, texX1 / fontWidth, texY1 / fontHeight, texX1 / fontWidth, texY2 / fontHeight, texX2 / fontWidth, texY2 / fontHeight);
        carr.unshift(0, 0, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5);
        carr.unshift(0, 0, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0, 0.5);

        nametagVertexBuilt = createBuffer(varr, 3, gl.STATIC_DRAW);
        nametagTextureBuilt = createBuffer(tarr, 2, gl.STATIC_DRAW);
        nametagColorBuilt = createBuffer(carr, 4, gl.STATIC_DRAW);
    }
    this._nametagX = -1;
    this._nametagY = -1;
    this._nametagZ = -1;
    this.renderNametag = function() {
        if(nametagVertexBuilt == null || nametagTextureBuilt == null || nametagColorBuilt == null)
            return;

        if(this._nametagX < 0 && this._nametagY < 0) return;

        var pMvMatrix = mat4.clone(mvMatrix);
        vec3.set(translation, this._nametagX, this._nametagY, 0);
        mat4.translate(mvMatrix, mvMatrix, translation);

        vec3.set(translation, 4 / this._nametagZ, 4 / this._nametagZ, 0);
        mat4.scale(mvMatrix, mvMatrix, translation);

        vec3.set(translation, -nametagWidth / 2, 0, 0);
        mat4.translate(mvMatrix, mvMatrix, translation);

        gl.bindBuffer(gl.ARRAY_BUFFER, nametagColorBuilt);
        gl.vertexAttribPointer(client.mainShader.colorAttribute, nametagColorBuilt.entnum, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, nametagTextureBuilt);
        gl.vertexAttribPointer(client.mainShader.textureCoordAttribute, nametagTextureBuilt.entnum, gl.FLOAT, false, 0, 0);
        drawArray(nametagVertexBuilt, gl.TRIANGLES, client.mainShader);

        mvMatrix = pMvMatrix;
    }
}

function PlayerEntity(client, id, chunk, name) {
    this.extend(new Entity(id, chunk));
    this.bodyYaw = 0;
    this.renderer = new PlayerRenderer(client);
    this.name = name;

    this.move = function(newX, newY, newZ) {
        var pChunkX = this.x >> 4;
        var pChunkZ = this.z >> 4;
        var nChunkX = newX >> 4;
        var nChunkZ = newZ >> 4;
        if(pChunkX != nChunkX || pChunkZ != nChunkZ) {
            if(this.chunk != null)
                delete this.chunk.entities[this.id];
            this.chunk = client.getChunk(nChunkX, nChunkZ);
            if(this.chunk != null)
                this.chunk.entities[this.id] = this;
        }
        this.x = newX;
        this.y = newY;
        this.z = newZ;
    }

    this.render = function(currentTime, deltaTime) {
        this.renderer.render(this, currentTime, deltaTime);
    }

    this.getAABB = function() {
        return [-0.3, 0, 0.3, 1.8];
    }

    this.rebuildNametag();
}

function EntityRenderer() {
    this.render = function(entity, currentTime, deltaTime) {
        //
    }
}

function PlayerRenderer(client) {
    this.extend(new EntityRenderer());
    this.head = new ModelPart(0, 1.4, 0);
    this.head.objects.push(new Cube(-0.23, 0, -0.23, 0.23, 0.46, 0.23, [
        [16 / 64, 0, 24 / 64, 8 / 32],
        [8 / 64, 0, 16 / 64, 8 / 32],
        [8 / 64, 8 / 32, 16 / 64, 16 / 32],
        [22 / 64, 8 / 32, 28 / 64, 16 / 32],
        [0, 8 / 32, 8 / 64, 16 / 32],
        [16 / 64, 8 / 32, 22 / 64, 16 / 32]
    ]));
    this.head.rebuild();

    this.body = new ModelPart(0, 0.7 + 0.35, 0);
    this.body.objects.push(new Cube(-0.23, -0.35, -0.116, 0.23, 0.35, 0.116, [
        [28 / 64, 16 / 32, 36 / 64, 20 / 32],
        [20 / 64, 16 / 32, 28 / 64, 20 / 32],
        [20 / 64, 20 / 32, 28 / 64, 32 / 32],
        [32 / 64, 20 / 32, 40 / 64, 32 / 32],
        [32 / 64, 20 / 32, 28 / 64, 32 / 32],
        [16 / 64, 20 / 32, 20 / 64, 32 / 32]
    ]));
    this.body.rebuild();

    this.lArm = new ModelPart(-0.23, 1.4, 0);
    this.lArm.objects.push(new Cube(-0.257, -0.7, -0.129, 0, 0, 0.129, [
        [48 / 64, 16 / 32, 52 / 64, 20 / 32],
        [44 / 64, 16 / 32, 48 / 64, 20 / 32],
        [44 / 64, 20 / 32, 48 / 64, 32 / 32],
        [56 / 64, 20 / 32, 52 / 64, 32 / 32],
        [52 / 64, 20 / 32, 48 / 64, 32 / 32],
        [44 / 64, 20 / 32, 40 / 64, 32 / 32]
    ]));
    this.lArm.rebuild();

    this.rArm = new ModelPart(0.23, 1.4, 0);
    this.rArm.objects.push(new Cube(0, -0.7, -0.129, 0.257, 0, 0.129, [
        [52 / 64, 16 / 32, 48 / 64, 20 / 32],
        [48 / 64, 16 / 32, 44 / 64, 20 / 32],
        [48 / 64, 20 / 32, 44 / 64, 32 / 32],
        [52 / 64, 20 / 32, 56 / 64, 32 / 32],
        [40 / 64, 20 / 32, 44 / 64, 32 / 32],
        [48 / 64, 20 / 32, 52 / 64, 32 / 32]
    ]));
    this.rArm.rebuild();

    this.lLeg = new ModelPart(-0.115, 0.7, 0);
    this.lLeg.objects.push(new Cube(-0.116, -0.7, -0.116, 0.116, 0, 0.116, [
        [8 / 64, 16 / 32, 12 / 64, 20 / 32],
        [4 / 64, 16 / 32, 8 / 64, 20 / 32],
        [4 / 64, 20 / 32, 8 / 64, 32 / 32],
        [16 / 64, 20 / 32, 12 / 64, 32 / 32],
        [12 / 64, 20 / 32, 8 / 64, 32 / 32],
        [4 / 64, 20 / 32, 0 / 64, 32 / 32]
    ]));
    this.lLeg.rebuild();

    this.rLeg = new ModelPart(0.115, 0.7, 0);
    this.rLeg.objects.push(new Cube(-0.116, -0.7, -0.116, 0.116, 0, 0.116, [
        [12 / 64, 16 / 32, 8 / 64, 20 / 32],
        [8 / 64, 16 / 32, 4 / 64, 20 / 32],
        [8 / 64, 20 / 32, 4 / 64, 32 / 32],
        [12 / 64, 20 / 32, 16 / 64, 32 / 32],
        [0 / 64, 20 / 32, 4 / 64, 32 / 32],
        [8 / 64, 20 / 32, 12 / 64, 32 / 32]
    ]));
    this.rLeg.rebuild();

    this.render = function(entity, currentTime, deltaTime) {
        var pMvMatrix = mat4.clone(mvMatrix);

        vec3.set(translation, entity.x, entity.y, entity.z);
        mat4.translate(mvMatrix, mvMatrix, translation);

        if(entity.lastAttackTime >= currentTime - 500) {
            gl.uniform4f(client.entityShader.fragmentColor, 1.0, 0.0, 0.0, 0.3);
        } else {
            gl.uniform4f(client.entityShader.fragmentColor, 0.0, 0.0, 0.0, 0.0);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[client.playerTexture]);

        if(entity.name != null) {
            var pos = vec4.create();
            vec4.set(pos, 0, 2.2, 0, 1);
            vec4.transformMat4(pos, pos, mvMatrix);
            vec4.transformMat4(pos, pos, pMatrix);
            if(pos[3] > 0.0) {
                pos[0] /= pos[3];
                pos[1] /= pos[3];
                pos[0] = (pos[0] * 0.5 + 0.5);
                pos[1] = (pos[1] * 0.5 + 0.5);
                if(pos[0] > 1 || pos[1] > 1) {
                    entity._nametagX = -1;
                    entity._nametagY = -1;
                } else {
                    pos[0] *= gl.viewportWidth / client.guiScale;
                    pos[1] *= gl.viewportHeight / client.guiScale;
                    entity._nametagX = pos[0];
                    entity._nametagY = pos[1];
                    entity._nametagZ = pos[2];
                }
            } else {
                entity._nametagX = -1;
                entity._nametagY = -1;
            }
        }
        this.head.rotX = entity.pitch;
        this.head.rotY = -entity.yaw;
        this.head.render(client);

        mat4.rotateY(mvMatrix, mvMatrix, -entity.bodyYaw);

        this.body.render(client);

        var armRotZ = (currentTime % 2000) * 0.1 / 2000;
        if(armRotZ > 0.05) armRotZ = 0.1 - armRotZ;
        //this.lArm.rotZ = -armRotZ;
        this.lArm.render(client);

        //this.rArm.rotZ = armRotZ;
        this.rArm.render(client);

        this.lLeg.render(client);
        this.rLeg.render(client);

        mvMatrix = pMvMatrix;
    }
}

function ModelPart(x, y, z) {
    this.objects = [];
    this.built = null;
    this.builtTex = null;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rotX = 0;
    this.rotY = 0;
    this.rotZ = 0;

    this.rebuild = function() {
        var arr = [];
        var tarr = [];
        for(var i = 0; i < this.objects.length; i++) {
            this.objects[i].rebuild(arr, tarr);
        }
        this.built = createBuffer(arr, 3, gl.STATIC_DRAW);
        this.builtTex = createBuffer(tarr, 2, gl.STATIC_DRAW);
    };

    this.render = function(client) {
        var pMvMatrix = mat4.clone(mvMatrix);

        vec3.set(translation, this.x, this.y, this.z);
        mat4.translate(mvMatrix, mvMatrix, translation);

        mat4.rotateY(mvMatrix, mvMatrix, this.rotY);
        mat4.rotateX(mvMatrix, mvMatrix, this.rotX);
        mat4.rotateZ(mvMatrix, mvMatrix, this.rotZ);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.builtTex);
        gl.vertexAttribPointer(client.entityShader.textureCoordAttribute, this.builtTex.entnum, gl.FLOAT, false, 0, 0);
        drawArray(this.built, gl.TRIANGLES, client.entityShader);

        mvMatrix = pMvMatrix;
    }
}

function Cube(x1, y1, z1, x2, y2, z2, mt) {
    this.x1 = x1;
    this.y1 = y1;
    this.z1 = z1;
    this.x2 = x2;
    this.y2 = y2;
    this.z2 = z2;
    this.mt = mt;

    this.rebuild = function(arr, tarr) {
        var tex = addTextureOffset([this.mt[0][0], this.mt[0][1], this.mt[0][2], this.mt[0][3]]);
        arr.push(this.x2, this.y1, this.z2, this.x1, this.y1, this.z2, this.x2, this.y1, this.z1);
        arr.push(this.x1, this.y1, this.z2, this.x1, this.y1, this.z1, this.x2, this.y1, this.z1);
        tarr.push(tex[2], tex[3], tex[0], tex[3], tex[2], tex[1]);
        tarr.push(tex[0], tex[3], tex[0], tex[1], tex[2], tex[1]);
        tex = addTextureOffset([this.mt[1][0], this.mt[1][1], this.mt[1][2], this.mt[1][3]]);
        arr.push(this.x2, this.y2, this.z2, this.x2, this.y2, this.z1, this.x1, this.y2, this.z2);
        arr.push(this.x1, this.y2, this.z2, this.x2, this.y2, this.z1, this.x1, this.y2, this.z1);
        tarr.push(tex[2], tex[3], tex[2], tex[1], tex[0], tex[3]);
        tarr.push(tex[0], tex[3], tex[2], tex[1], tex[0], tex[1]);
        tex = addTextureOffset([this.mt[2][0], this.mt[2][3], this.mt[2][2], this.mt[2][1]]);
        arr.push(this.x2, this.y2, this.z2, this.x1, this.y2, this.z2, this.x2, this.y1, this.z2);
        arr.push(this.x1, this.y2, this.z2, this.x1, this.y1, this.z2, this.x2, this.y1, this.z2);
        tarr.push(tex[2], tex[3], tex[0], tex[3], tex[2], tex[1]);
        tarr.push(tex[0], tex[3], tex[0], tex[1], tex[2], tex[1]);
        tex = addTextureOffset([this.mt[3][0], this.mt[3][3], this.mt[3][2], this.mt[3][1]]);
        arr.push(this.x2, this.y2, this.z1, this.x2, this.y1, this.z1, this.x1, this.y2, this.z1);
        arr.push(this.x1, this.y2, this.z1, this.x2, this.y1, this.z1, this.x1, this.y1, this.z1);
        tarr.push(tex[2], tex[3], tex[2], tex[1], tex[0], tex[3]);
        tarr.push(tex[0], tex[3], tex[2], tex[1], tex[0], tex[1]);
        tex = addTextureOffset([this.mt[4][0], this.mt[4][3], this.mt[4][2], this.mt[4][1]]);
        arr.push(this.x2, this.y2, this.z2, this.x2, this.y1, this.z2, this.x2, this.y2, this.z1);
        arr.push(this.x2, this.y1, this.z2, this.x2, this.y1, this.z1, this.x2, this.y2, this.z1);
        tarr.push(tex[2], tex[3], tex[2], tex[1], tex[0], tex[3]);
        tarr.push(tex[2], tex[1], tex[0], tex[1], tex[0], tex[3]);
        tex = addTextureOffset([this.mt[5][2], this.mt[5][3], this.mt[5][0], this.mt[5][1]]);
        arr.push(this.x1, this.y2, this.z2, this.x1, this.y2, this.z1, this.x1, this.y1, this.z2);
        arr.push(this.x1, this.y1, this.z2, this.x1, this.y2, this.z1, this.x1, this.y1, this.z1);
        tarr.push(tex[2], tex[3], tex[0], tex[3], tex[2], tex[1]);
        tarr.push(tex[2], tex[1], tex[0], tex[3], tex[0], tex[1]);
    }
}
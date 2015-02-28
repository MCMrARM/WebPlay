var guiTextureWidth = 256;
var guiTextureHeight = 256;

function GuiElement(x, y, w, h, tex, textureWidth, textureHeight) {
    if(textureWidth == null)
        textureWidth = guiTextureWidth;
    if(textureHeight == null)
        textureHeight = guiTextureHeight;
    this.vbuffer = null;
    this.tbuffer = null;
    this.cbuffer = null;
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.tex = tex;

    this.rebuild = function() {
        if(this.vbuffer != null) {
            gl.deleteBuffer(this.vbuffer);
            this.vbuffer = null;
        }
        if(this.tbuffer != null) {
            gl.deleteBuffer(this.tbuffer);
            this.tbuffer = null;
        }
        if(this.tex == null)
            return;
        var x1 = this.x;
        var y1 = this.y;
        var x2 = this.x + this.width;
        var y2 = this.y + this.height;
        this.vbuffer = createBuffer([this.width, this.height, 0, 0, this.height, 0, this.width, 0, 0,
            0, this.height, 0, 0, 0, 0, this.width, 0, 0
        ], 3, gl.STATIC_DRAW);
        this.tbuffer = createBuffer([this.tex[2] / textureWidth, this.tex[1] / textureHeight, this.tex[0] / textureWidth, this.tex[1] / textureHeight, this.tex[2] / textureWidth, this.tex[3] / textureHeight, this.tex[0] / textureWidth, this.tex[1] / textureHeight, this.tex[0] / textureWidth, this.tex[3] / textureHeight, this.tex[2] / textureWidth, this.tex[3] / textureHeight], 2, gl.STATIC_DRAW);
        this.cbuffer = createBuffer([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 4, gl.STATIC_DRAW);
    };

    this.render = function(client, x, y) {
        if(this.tbuffer == null || this.vbuffer == null)
            return;
        if(this.x == 0 && this.y == 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuffer);
            gl.vertexAttribPointer(client.mainShader.colorAttribute, this.cbuffer.entnum, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuffer);
            gl.vertexAttribPointer(client.mainShader.textureCoordAttribute, this.tbuffer.entnum, gl.FLOAT, false, 0, 0);
            drawArray(this.vbuffer, gl.TRIANGLES, client.mainShader);
            return;
        }
        var pMvMatrix = mat4.clone(mvMatrix);

        vec3.set(translation, this.x, this.y, 0);
        mat4.translate(mvMatrix, mvMatrix, translation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuffer);
        gl.vertexAttribPointer(client.mainShader.colorAttribute, this.cbuffer.entnum, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuffer);
        gl.vertexAttribPointer(client.mainShader.textureCoordAttribute, this.tbuffer.entnum, gl.FLOAT, false, 0, 0);
        drawArray(this.vbuffer, gl.TRIANGLES, client.mainShader);

        mvMatrix = pMvMatrix;
    };

    this.rebuild();
}

function GuiLabel(x, y, s, text, color) {
    this.extend(new GuiElement(x, y, 0, 0, 0, 0, 0));
    this.x = x;
    this.y = y;
    this.scale = s;
    this.text = text;
    this.color = color;

    this.rebuild = function() {
        if(this.vbuffer != null) {
            gl.deleteBuffer(this.vbuffer);
            this.vbuffer = null;
        }
        if(this.tbuffer != null) {
            gl.deleteBuffer(this.tbuffer);
            this.tbuffer = null;
        }
        if(this.text == null) return;
        var varr = [];
        var tarr = [];
        var carr = [];

        this.width = buildFontShadow(varr, tarr, carr, 0, 0, 0, this.scale, this.text, this.color[0], this.color[1], this.color[2], this.color[3]);

        this.vbuffer = createBuffer(varr, 3, gl.STATIC_DRAW);
        this.tbuffer = createBuffer(tarr, 2, gl.STATIC_DRAW);
        this.cbuffer = createBuffer(carr, 4, gl.STATIC_DRAW);
    };

    this.rebuild();
}

function GuiItem(x, y, w, h, item) {
    this.extend(new GuiElement(x, y, w, h, (item == null || item.id < 256) ? null : item.getTexture(), 16, 16));
    this._render = this.render;
    this.cbuffer = null;
    var isBlock = false;
    this.render = function(client, x, y) {
        if(isBlock) {
            var pMvMatrix = mat4.clone(mvMatrix);
            var pPMatrix = mat4.clone(pMatrix);
            gl.enable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.uniform1i(client.mainShader.samplerUniform, 1);

            vec3.set(translation, this.x, this.y, 0);
            mat4.translate(mvMatrix, mvMatrix, translation);
            mat4.rotateX(mvMatrix, mvMatrix, 0.5);
            mat4.rotateY(mvMatrix, mvMatrix, 1);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.cbuffer);
            gl.vertexAttribPointer(client.mainShader.colorAttribute, this.cbuffer.entnum, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuffer);
            gl.vertexAttribPointer(client.mainShader.textureCoordAttribute, this.tbuffer.entnum, gl.FLOAT, false, 0, 0);
            drawArray(this.vbuffer, gl.TRIANGLES, client.mainShader);

            gl.uniform1i(client.mainShader.samplerUniform, 2);
            mvMatrix = pMvMatrix;
            pMatrix = pPMatrix;
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
        } else {
            this._render(client, x, y);
        }
    };
    this.setItem = function(item, dmg) {
        if(item == null || item.id > 256) {
            this.tex = item == null ? null : item.getTexture();
            this.rebuild();
            isBlock = false;
        } else {
            // block
            if(this.vbuffer != null) {
                gl.deleteBuffer(this.vbuffer);
                this.vbuffer = null;
            }
            if(this.tbuffer != null) {
                gl.deleteBuffer(this.tbuffer);
                this.tbuffer = null;
            }
            if(this.cbuffer != null) {
                gl.deleteBuffer(this.cbuffer);
                this.cbuffer = null;
            }
            var varr = [];
            var tarr = [];
            var carr = [];
            isBlock = true;
            buildBlock(varr, tarr, carr, 18, -9, -10, 10, item, dmg, false, true, false, true, true, false);
            for(var i = 0; i < 3 * 2; i++) {
                carr[i * 4] = 0.6;
                carr[i * 4 + 1] = 0.6;
                carr[i * 4 + 2] = 0.6;
                carr[3 * 2 * 4 + i * 4] = 0.7;
                carr[3 * 2 * 4 + i * 4 + 1] = 0.7;
                carr[3 * 2 * 4 + i * 4 + 2] = 0.7;
                carr[3 * 2 * 4 * 2 + i * 4] = 0.8;
                carr[3 * 2 * 4 * 2 + i * 4 + 1] = 0.8;
                carr[3 * 2 * 4 * 2 + i * 4 + 2] = 0.8;
            }
            this.vbuffer = createBuffer(varr, 3, gl.STATIC_DRAW);
            this.tbuffer = createBuffer(tarr, 2, gl.STATIC_DRAW);
            this.cbuffer = createBuffer(carr, 4, gl.STATIC_DRAW);
        }
    }
    if(item != null && item.id < 256) this.setItem(item);
}

function IngameGui(client) {
    this.hotbar = new GuiElement(0, 0, 182, 22, [0, 0, 182, 22]);
    this.hotbarSel = new GuiElement(0, -1, 24, 24, [0, 22, 24, 46]);
    this.hotbarSlot = [];
    for(var i = 0; i < 9; i++) {
        this.hotbarSlot[i] = new GuiItem(10 + i * 20, 3, 16, 16, null);
    }

    this.showInventory = false;
    this.slots = [];
    for(var i = 0; i < 9; i++) {
        for(var j = 0; j < 3; j++) {
            this.slots[j * 9 + i] = new GuiItem(10 + i * 20, 3 + j * 20, 16, 16, getBlockById(1));
        }
    }

    this.titleLabel = new GuiLabel(0, 0, 4, null, [0, 0.6, 0, 1]);
    this.subtitleLabel = new GuiLabel(0, 0, 2, null, [0, 0.6, 0, 1]);

    this.titleShowTime = -1;
    this.titleTime = -1;
    this.titleFade = -1;

    var chatBgEl = new GuiElement(0, -1, 400, 10, [0, 0, 1, 1]);
    this.chatLabels = [];

    this.render = function(client, x, y, time) {
        gl.uniform1i(client.mainShader.samplerUniform, 0);
        this.hotbar.render(client, x, y);
        this.hotbarSel.render(client, x, y);
        gl.uniform1i(client.mainShader.samplerUniform, 2);
        for(var i = 0; i < 9; i++) {
            this.hotbarSlot[i].render(client, x, y);
        }
        if(this.showInventory) {
            for(var i = 0; i < 27; i++) {
                this.slots[i].render(client, x, y);
            }
        }
        gl.uniform1i(client.mainShader.mainUniform, 0);

        gl.uniform1i(client.mainShader.samplerUniform, 3);
        if(this.titleFade > 0) {
            var d = time - this.titleFade;
            if(d > 500) {
                this.titleFade = -1;
                this.titleLabel.text = null;
                this.subtitleLabel.text = null;
                this.titleLabel.rebuild();
                this.subtitleLabel.rebuild();
            } else if(d != 0) {
                var v = 0.5 - Math.cos(d / 500 * Math.PI) / 2;
                gl.uniform4f(client.mainShader.fragmentColorUniform, 1 - v, 1 - v, 1 - v, 1 - v);
            }
        } else if(this.titleTime != -1) {
            if(time - this.titleShowTime > this.titleTime) {
                if(this.titleFade == -1) {
                    this.titleLabel.text = null;
                    this.subtitleLabel.text = null;
                    this.titleLabel.rebuild();
                    this.subtitleLabel.rebuild();
                } else {
                    this.titleFade = new Date().getTime();
                }
            }
        }
        if(this.titleLabel.text != null)
            this.titleLabel.render(client, x, y);
        if(this.subtitleLabel.text != null)
            this.subtitleLabel.render(client, x, y);


        gl.uniform4f(client.mainShader.fragmentColorUniform, 0, 0, 0, 0.5);
        gl.uniform1i(client.mainShader.samplerUniform, 4);

        if(this.chatLabels.length > 0) {
            var pMvMatrix = mat4.clone(mvMatrix);
            vec3.set(translation, 10, (this.chatLabels.length - 1) + 10 + 20, 0);
            mat4.translate(mvMatrix, mvMatrix, translation);
            vec3.set(translation, 1, this.chatLabels.length, 1);
            mat4.scale(mvMatrix, mvMatrix, translation);

            chatBgEl.render(client, x, y);

            mvMatrix = pMvMatrix;

            gl.uniform1i(client.mainShader.samplerUniform, 3);
            gl.uniform4f(client.mainShader.fragmentColorUniform, 1, 1, 1, 1);
            for(var i = this.chatLabels.length - 1; i >= 0; i--) {
                var lbl = this.chatLabels[i];
                if(time > lbl.showTime + 10000) {
                    this.chatLabels.splice(i, 1);
                    continue;
                }

                if(time > lbl.showTime + 9000) {
                    var v = 0.5 - Math.cos((time - lbl.showTime) / 1000 * Math.PI) / 2;
                    gl.uniform4f(client.mainShader.fragmentColorUniform, v, v, v, v);
                }
                lbl.y = this.chatLabels.length * 10 - i * 10 + 20;
                lbl.render(client, x, y);

                if(time > lbl.showTime + 9000) {
                    gl.uniform4f(client.mainShader.fragmentColorUniform, 1, 1, 1, 1);
                }
            }
        }
    };

    this.updateInventory = function() {
        if(client.inventory == null) return;
        for(var i = 0; i < 27; i++) {
            var item = client.inventory[i];
            if(item == null || item[0] == -1 || item[0] == 0) {
                this.slots[i].setItem(null);
                continue;
            }
            if(item[0] < 256) {
                this.slots[i].setItem(getBlockById(item[0]), item[1]);
            } else {
                this.slots[i].setItem(itemIds[item[0]]);
            }
        }
    };

    this.updateHotbar = function() {
        if(client.hotbar == null || client.inventory == null) return;
        for(var i = 0; i < 9; i++) {
            var item = client.hotbar[i];
            if(item == -1) {
                this.hotbarSlot[i].setItem(null);
                continue;
            }
            item = client.inventory[item - 9];
            if(item == null) {
                this.hotbarSlot[i].setItem(null);
                continue;
            }
            if(item[0] != 0 && item[0] < 256) {
                this.hotbarSlot[i].setItem(getBlockById(item[0]), item[1]);
            } else {
                this.hotbarSlot[i].setItem(itemIds[item[0]]);
            }
        }
    };

    this.updateSelectedSlot = function() {
        this.hotbarSel.x = this.hotbar.x - 1 + client.selectedHotbarSlot * 20;
    };

    this.setupPositions = function(width, height) {
        width = width / client.guiScale;
        height = height / client.guiScale;
        this.hotbar.x = width / 2 - this.hotbar.width / 2;
        this.updateSelectedSlot();
        for(var i = 0; i < 9; i++) {
            this.hotbarSlot[i].x = this.hotbar.x + 3 + i * 20;
        }
        this.titleLabel.x = width / 2 - this.titleLabel.width / 2;
        this.titleLabel.y = height / 2;
        this.subtitleLabel.x = width / 2 - this.subtitleLabel.width / 2;
        this.subtitleLabel.y = height / 2 - 25;
    };

    this.setTitle = function(title, subtitle, time, fade, titleColor, subtitleColor) {
        this.titleLabel.text = title;
        this.subtitleLabel.text = subtitle;
        this.titleLabel.color = titleColor;
        this.subtitleLabel.color = subtitleColor;
        this.titleLabel.rebuild();
        this.subtitleLabel.rebuild();
        this.titleLabel.x = client.canvas.width / client.guiScale / 2 - this.titleLabel.width / 2;
        this.subtitleLabel.x = client.canvas.width / client.guiScale / 2 - this.subtitleLabel.width / 2;
        this.titleFade = fade ? 0 : -1;
        this.titleTime = time == -1 ? -1 : (time * 1000);
        this.titleShowTime = new Date().getTime();
    };

    this.addMessage = function(msg) {
        var lbl = new GuiLabel(10, 0, 1, msg, [1, 1, 1, 1]);
        lbl.showTime = new Date().getTime();
        this.chatLabels.push(lbl);
    };

    client.resizeCallbacks.push(this.setupPositions.bind(this));
    this.setupPositions(client.canvas.width, client.canvas.height);
}
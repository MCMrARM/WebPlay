function NetworkHandler(client, address) {
    var ws = new WebSocket(address);
    var wsOpened = false;
    ws.binaryType = "arraybuffer";
    ws.onopen = function() {
        console.log("Connected!");
        wsOpened = true;
    };
    ws.onmessage = function(msg) {
        var buf = new Uint8Array(msg.data);
        var id = buf[0];
        //console.log(id);
        if(id == 1) { // add chunk
            var passData = {
                "action": 0,
                "data": msg.data
            };
            client.chunkWorker.postMessage(passData, [passData.data]);
        } else if(id == 2) { // set block
            var dv = new DataView(msg.data);
            var x = dv.getInt32(1);
            var z = dv.getInt32(5);
            var y = dv.getInt8(9, true);
            var id = dv.getUint8(10);
            var data = dv.getUint8(11);

            var chunkX = x >> 4;
            var chunkZ = z >> 4;
            var chunk = client.getChunk(chunkX, chunkZ);
            if(chunk == null) return;
            if(id == 0) {
                chunk.setBlock(x & 0xf, y, z & 0xf, null);
            } else {
                chunk.setBlock(x & 0xf, y, z & 0xf, id, data);
            }
            console.log(x + " " + y + " " + z + "; " + id + ":" + data);
            chunk.rebuild(gl, true);
        } else if(id == 3) { // unload chunk
            var dv = new DataView(msg.data);
            var chunkX = dv.getInt32(1);
            var chunkZ = dv.getInt32(5);
            console.log("unload: " + chunkX + ", " + chunkZ);
            client.chunks[chunkX][chunkZ].deleteBuffers(gl);
            delete client.chunks[chunkX][chunkZ];
        } else if(id == 4) { // set position
            var dv = new DataView(msg.data);
            client.posX = dv.getFloat32(1, true);
            client.posY = dv.getFloat32(5, true);
            client.posZ = dv.getFloat32(9, true);
        } else if(id == 5) { // chat
            var text = new TextDecoder().decode(new Uint8Array(msg.data, 1));
            console.log(text);
        } else if(id == 6) { // add player
            var dv = new DataView(msg.data);
            var id = dv.getInt32(1);
            var x = dv.getFloat32(5, true);
            var y = dv.getFloat32(9, true);
            var z = dv.getFloat32(13, true);
            var pitch = dv.getFloat32(17, true);
            var yaw = dv.getFloat32(21, true);
            var strLen = dv.getInt32(25);
            var str = "";
            for(var i = 0; i < strLen; i++) {
                str += String.fromCharCode(dv.getInt8(29 + i));
            }
            console.log(str + " joined!");

            var chunkX = x >> 4;
            var chunkZ = z >> 4;
            var chunk = client.getChunk(chunkX, chunkZ);
            if(chunk == null) {
                chunk = client.setChunk(chunkX, chunkZ, new FullChunk());
            }
            var ent = new PlayerEntity(client, id, chunk, str);
            ent.x = x;
            ent.y = y;
            ent.z = z;
            ent.pitch = pitch * Math.PI / 180;
            ent.yaw = Math.PI * 2 + yaw * Math.PI / 180;
            ent.bodyYaw = ent.yaw;
            chunk.entities[id] = ent;
            client.entities[id] = ent;
        } else if(id == 7) { // move player
            var dv = new DataView(msg.data);
            var id = dv.getInt32(1);
            var x = dv.getFloat32(5, true);
            var y = dv.getFloat32(9, true);
            var z = dv.getFloat32(13, true);
            var pitch = dv.getFloat32(17, true);
            var yaw = dv.getFloat32(21, true);
            var bodyYaw = dv.getFloat32(25, true);

            var ent = client.entities[id];
            if(ent != null) {
                ent.move(x, y, z);
                ent.pitch = pitch * Math.PI / 180;
                ent.yaw = Math.PI * 2 + yaw * Math.PI / 180;
                ent.bodyYaw = Math.PI * 2 + bodyYaw * Math.PI / 180;
            }
        } else if(id == 8) { // delete entity
            var dv = new DataView(msg.data);
            var id = dv.getInt32(1);

            var ent = client.entities[id];
            if(ent != null) {
                delete ent.chunk.entities[id];
                delete client.entities[id];
            }
        } else if(id == 9) { // entity event
            var dv = new DataView(msg.data);
            var id = dv.getInt32(1);
            var eventId = dv.getInt8(5);
            console.log(id + " " + eventId);

            if(id == 0) return;
            if(eventId == 2) {
                // hurt
                var ent = client.entities[id];
                ent.lastAttackTime = new Date().getTime();
            } else if(eventId == 3) {
                // died
            }
        } else if(id == 10) { // inventory
            var dv = new DataView(msg.data);
            var id = dv.getInt8(1);
            var slotCount = dv.getInt16(2, true);
            var slots = [];
            var off = 4;
            for(var i = 0; i < slotCount; i++) {
                slots.push([dv.getInt16(off, true), dv.getInt8(off + 2), dv.getInt16(off + 3, true)]);
                off += 5;
            }
            var hotbarCount = dv.getInt16(off, true);
            off += 2;
            var hotbar = [];
            for(var i = 0; i < hotbarCount; i++) {
                hotbar.push(dv.getInt32(off));
                off += 4;
            }
            if(id == 0) {
                client.inventory = slots;
                client.hotbar = hotbar;
                client.ingameGui.updateInventory();
                client.ingameGui.updateHotbar();
            }
        } else if(id == 11) { // inventory, set slot
            var dv = new DataView(msg.data);
            var id = dv.getInt8(1);
            var slotId = dv.getInt16(2, true);
            var slot = [dv.getInt16(4, true), dv.getInt8(6), dv.getInt16(7, true)];
            if(id == 0) {
                client.inventory[slotId] = slot;
                client.ingameGui.updateInventory();
            }
        } else if(id == 12) { // motion
            var dv = new DataView(msg.data);
            var count = dv.getInt16(1, true);
            var off = 3;
            for(var i = 0; i < count; i++) {
                var eid = dv.getInt32(off);
                var motionX = dv.getFloat32(off + 4, true);
                var motionY = dv.getFloat32(off + 8, true);
                var motionZ = dv.getFloat32(off + 12, true);
                if(eid == 0) {
                    client.motionX = motionX;
                    client.motionY = motionY;
                    client.motionZ = motionZ;
                }
                off += 16;
            }
        } else if(id == 13) { // title
            var dv = new DataView(msg.data);
            var titleLen = dv.getUint8(1);
            var off = 2;
            var title = titleLen == 255 ? null : new TextDecoder().decode(new Uint8Array(msg.data, off, titleLen));
            off += (titleLen == 255 ? 0 : titleLen);
            var subtitleLen = dv.getUint8(off);
            off++;
            var subtitle = subtitleLen == 255 ? null : new TextDecoder().decode(new Uint8Array(msg.data, off, subtitleLen));
            off += (subtitleLen == 255 ? 0 : subtitleLen);
            var time = dv.getInt16(off, true);
            off += 2;
            var fade = (dv.getInt8(off) == 1);
            off++;
            var titleR = dv.getFloat32(off, true);
            off += 4;
            var titleG = dv.getFloat32(off, true);
            off += 4;
            var titleB = dv.getFloat32(off, true);
            off += 4;
            var titleA = dv.getFloat32(off, true);
            off += 4;
            var subtitleR = dv.getFloat32(off, true);
            off += 4;
            var subtitleG = dv.getFloat32(off, true);
            off += 4;
            var subtitleB = dv.getFloat32(off, true);
            off += 4;
            var subtitleA = dv.getFloat32(off, true);
            off += 4;

            console.log(title + "; " + subtitle + "; " + time + "; " + fade);
            client.ingameGui.setTitle(title, subtitle, time, fade, [titleR, titleG, titleB, titleA], [subtitleR, subtitleG, subtitleB, subtitleA]);
        }
    }

    this.tick = function() {
        if(wsOpened) {
            var posChg = false;
            var rotChg = false;
            if(client.pposX != client.posX || client.pposY != client.posY || client.pposZ != client.posZ) {
                posChg = true;
            }
            if(client.pyaw != client.yaw || client.ppitch != client.pitch) {
                rotChg = true;
            }
            if(posChg && rotChg) {
                // pos & look
                var off = 0;
                var p = new DataView(new ArrayBuffer(21));
                p.setInt8(off, 1);
                off++;
                p.setFloat32(off, client.posX, true);
                off += 4;
                p.setFloat32(off, client.posY - 1.62, true);
                off += 4;
                p.setFloat32(off, client.posZ, true);
                off += 4;
                p.setFloat32(off, 180 + client.yaw * 180 / Math.PI, true);
                off += 4;
                p.setFloat32(off, client.pitch * 180 / Math.PI, true);
                off += 4;
                ws.send(p.buffer);
            } else if(posChg) {
                // pos
                var off = 0;
                var p = new DataView(new ArrayBuffer(13));
                p.setInt8(off, 2);
                off++;
                p.setFloat32(off, client.posX, true);
                off += 4;
                p.setFloat32(off, client.posY - 1.62, true);
                off += 4;
                p.setFloat32(off, client.posZ, true);
                off += 4;
                ws.send(p.buffer);
            } else if(rotChg) {
                // pos & look
                var off = 0;
                var p = new DataView(new ArrayBuffer(9));
                p.setInt8(off, 3);
                off++;
                p.setFloat32(off, 180 + client.yaw * 180 / Math.PI, true);
                off += 4;
                p.setFloat32(off, client.pitch * 180 / Math.PI, true);
                off += 4;
                ws.send(p.buffer);
            } else {
                // tick
                var off = 0;
                var p = new DataView(new ArrayBuffer(1));
                p.setInt8(off, 0);
                off++;
                ws.send(p.buffer);
            }
        }
    };

    this.sendAttackPacket = function(eid) {
        var off = 0;
        var p = new DataView(new ArrayBuffer(5));
        p.setInt8(off, 5);
        off++;
        p.setInt32(off, eid);
        off += 4;
        ws.send(p.buffer);
    };

    this.sendMessage = function(text) {
        var off = 0;
        var enc = new TextEncoder().encode(text);
        var p = new DataView(new ArrayBuffer(1 + enc.length));
        p.setInt8(off, 4);
        off++;
        for(var i = 0; i < enc.length; i++) {
            p.setInt8(off, enc[i]);
            off++;
        }
        ws.send(p.buffer);
    };

    this.sendUseItem = function(x, y, z, face) {
        var p = new DataView(new ArrayBuffer(14));
        p.setInt8(0, 6);
        p.setInt32(1, x);
        p.setInt32(5, y);
        p.setInt32(9, z);
        p.setInt8(13, face);
        ws.send(p.buffer);
    };

    this.sendHeldItem = function(id) {
        var p = new DataView(new ArrayBuffer(2));
        p.setInt8(0, 7);
        p.setInt8(1, id);
        ws.send(p.buffer);
    };

    this.sendLinkHotbar = function(hotbar, slot) {
        var p = new DataView(new ArrayBuffer(3));
        p.setInt8(0, 8);
        p.setInt8(1, hotbar);
        p.setInt8(2, slot);
        ws.send(p.buffer);
    }
}
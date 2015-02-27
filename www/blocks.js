var blockIds = new Array(256);

/*
	SIDES:
	0 -Y
	1 +Y
	2 -Z
	3 +Z
	4 -X
	5 +X
*/

function Block(id, name, texture) {
    this.id = id;
    this.name = name;
    this.texture = texture;
    if(this.texture.length == 2)
        this.texture = [texture[0], texture[1], texture[0] + 1, texture[1] + 1];
    this.transparent = false;
    this.hasAlpha = false;
    this.shape = [0, 0, 0, 1, 1, 1];

    this.getName = function(data) {
        return this.name;
    };
    this.getTexture = function(data, side) {
        return this.texture;
    };
    this.getColor = function(chunk, x, y, z, data) {
        return null;
    };
}

function StoneBlock() {
    this.extend(new Block(1, "Stone", [19, 0]));
    this.getName = function(data) {
        if(data == 1)
            return "Granite";
        if(data == 2)
            return "Polished Granite";
        if(data == 3)
            return "Diorite";
        if(data == 4)
            return "Polished Diorite";
        if(data == 5)
            return "Andesite";
        if(data == 6)
            return "Polished Andesite";
    };
    this.getTexture = function(data, side) {
        if(data == 1)
            return [20, 0, 21, 1];
        if(data == 2)
            return [21, 0, 22, 1];
        if(data == 3)
            return [22, 0, 23, 1];
        if(data == 4)
            return [23, 0, 24, 1];
        if(data == 5)
            return [24, 0, 25, 1];
        if(data == 6)
            return [25, 0, 26, 1];
        return [19, 0, 20, 1];
    };
}

function GrassBlock() {
    this.extend(new Block(2, "Grass", [19, 0]));
    this.getTexture = function(data, side) {
        if(side == 1)
            return [0, 0, 1, 1];
        if(side == 0)
            return [11, 1, 12, 2];
        return [3, 0, 4, 1];
    };

    this.getColor = function(chunk, x, y, z, data) {
        if(chunk == null || chunk.biomeColors == null) {
            return null;
        }
        return chunk.biomeColors[z * 16 + x];
    };
}

function WoodPlanksBlock() {
    this.extend(new Block(5, "Wood Planks", [14, 1]));
    this.getName = function(data) {
        if(data == 1)
            return "Spruce Planks";
        if(data == 2)
            return "Birch Planks";
        if(data == 3)
            return "Jungle Planks";
        if(data == 4)
            return "Acacia Planks";
        if(data == 5)
            return "Dark Oak Planks";
        return "Oak Planks";
    };
    this.getTexture = function(data, side) {
        if(data == 1)
            return [15, 1, 16, 2];
        if(data == 2)
            return [16, 1, 17, 2];
        if(data == 3)
            return [17, 1, 18, 2];
        if(data == 4)
            return [18, 1, 19, 2];
        if(data == 5)
            return [19, 1, 20, 2];
        return [14, 1, 15, 2];
    };
}

function WoolBlock() {
    this.extend(new Block(35, "Wool", [23, 9]));
    this.getName = function(data) {
        if(data == 1)
            return "Orange Wool";
        if(data == 2)
            return "Magenta Wool";
        if(data == 3)
            return "Light Blue Wool";
        if(data == 4)
            return "Yellow Wool";
        if(data == 5)
            return "Lime Wool";
        if(data == 6)
            return "Pink Wool";
        if(data == 7)
            return "Gray Wool";
        if(data == 8)
            return "Light Gray Wool";
        if(data == 9)
            return "Cyan Wool";
        if(data == 10)
            return "Purple Wool";
        if(data == 11)
            return "Blue Wool";
        if(data == 12)
            return "Brown Wool";
        if(data == 13)
            return "Green Wool";
        if(data == 14)
            return "Red Wool";
        if(data == 15)
            return "Black Wool";
        return "White Wool";
    };
    this.getTexture = function(data, side) {
        if(data == 1)
            return [24, 9, 25, 10];
        if(data == 2)
            return [25, 9, 26, 10];
        if(data == 3)
            return [26, 9, 27, 10];
        if(data == 4)
            return [27, 9, 28, 10];
        if(data == 5)
            return [28, 9, 29, 10];
        if(data == 6)
            return [29, 9, 30, 10];
        if(data == 7)
            return [30, 9, 31, 10];
        if(data == 8)
            return [31, 9, 32, 10];
        if(data == 9)
            return [0, 10, 1, 11];
        if(data == 10)
            return [1, 10, 2, 11];
        if(data == 11)
            return [2, 10, 3, 11];
        if(data == 12)
            return [3, 10, 4, 11];
        if(data == 13)
            return [4, 10, 5, 11];
        if(data == 14)
            return [5, 10, 6, 11];
        if(data == 15)
            return [6, 10, 7, 11];
        return [23, 9];
    };
}

function StainedClayBlock() {
    this.extend(new Block(159, "Stained Clay", [23, 9]));
    this.getName = function(data) {
        if(data == 1)
            return "Orange Stained Clay";
        if(data == 2)
            return "Magenta Stained Clay";
        if(data == 3)
            return "Light Blue Stained Clay";
        if(data == 4)
            return "Yellow Stained Clay";
        if(data == 5)
            return "Lime Stained Clay";
        if(data == 6)
            return "Pink Stained Clay";
        if(data == 7)
            return "Gray Stained Clay";
        if(data == 8)
            return "Light Gray Stained Clay";
        if(data == 9)
            return "Cyan Stained Clay";
        if(data == 10)
            return "Purple Stained Clay";
        if(data == 11)
            return "Blue Stained Clay";
        if(data == 12)
            return "Brown Stained Clay";
        if(data == 13)
            return "Green Stained Clay";
        if(data == 14)
            return "Red Stained Clay";
        if(data == 15)
            return "Black Stained Clay";
        return "White Stained Clay";
    };
    this.getTexture = function(data, side) {
        if(data == 1)
            return [9, 10, 10, 11];
        if(data == 2)
            return [10, 10, 11, 11];
        if(data == 3)
            return [11, 10, 12, 11];
        if(data == 4)
            return [12, 10, 13, 11];
        if(data == 5)
            return [13, 10, 14, 11];
        if(data == 6)
            return [14, 10, 15, 11];
        if(data == 7)
            return [15, 10, 16, 11];
        if(data == 8)
            return [16, 10, 17, 11];
        if(data == 9)
            return [17, 10, 18, 11];
        if(data == 10)
            return [18, 10, 19, 11];
        if(data == 11)
            return [19, 10, 20, 11];
        if(data == 12)
            return [20, 10, 21, 11];
        if(data == 13)
            return [21, 10, 22, 11];
        if(data == 14)
            return [22, 10, 23, 11];
        if(data == 15)
            return [23, 10, 24, 11];
        return [8, 10, 9, 11];
    };
}

function CarpetBlock() {
    this.extend(new Block(171, "Carpet", [23, 9]));
    this.shape = [0, 0, 0, 1, 0.1, 1];
    this.getName = function(data) {
        if(data == 1)
            return "Orange Carpet";
        if(data == 2)
            return "Magenta Carpet";
        if(data == 3)
            return "Light Blue Carpet";
        if(data == 4)
            return "Yellow Carpet";
        if(data == 5)
            return "Lime Carpet";
        if(data == 6)
            return "Pink Carpet";
        if(data == 7)
            return "Gray Carpet";
        if(data == 8)
            return "Light Gray Carpet";
        if(data == 9)
            return "Cyan Carpet";
        if(data == 10)
            return "Purple Carpet";
        if(data == 11)
            return "Blue Carpet";
        if(data == 12)
            return "Brown Carpet";
        if(data == 13)
            return "Green Carpet";
        if(data == 14)
            return "Red Carpet";
        if(data == 15)
            return "Black Carpet";
        return "White Carpet";
    };
    this.getTexture = function(data, side) {
        if(data == 1)
            return [24, 9, 25, 10];
        if(data == 2)
            return [25, 9, 26, 10];
        if(data == 3)
            return [26, 9, 27, 10];
        if(data == 4)
            return [27, 9, 28, 10];
        if(data == 5)
            return [28, 9, 29, 10];
        if(data == 6)
            return [29, 9, 30, 10];
        if(data == 7)
            return [30, 9, 31, 10];
        if(data == 8)
            return [31, 9, 32, 10];
        if(data == 9)
            return [0, 10, 1, 11];
        if(data == 10)
            return [1, 10, 2, 11];
        if(data == 11)
            return [2, 10, 3, 11];
        if(data == 12)
            return [3, 10, 4, 11];
        if(data == 13)
            return [4, 10, 5, 11];
        if(data == 14)
            return [5, 10, 6, 11];
        if(data == 15)
            return [6, 10, 7, 11];
        return [23, 9];
    };
}

function QuartzBlockBlock() {
    this.extend(new Block(155, "Block of Quartz", [15, 3]));
    this.getName = function(data) {
        if(data == 1)
            return "Chiseled Quartz Block";
        if(data > 2)
            return "Pillar Quartz Block";
        return "Block of Quartz";
    };
    this.getTexture = function(data, side) {
        if(side == 1)
            return [15, 3, 16, 4];
        if(side == 0)
            return [17, 3, 18, 4];
        return [16, 3, 17, 4];
    };
}

function ChestBlock() {
    this.extend(new Block(54, "Chest", [20, 9]));
    this.getTexture = function(data, side) {
        if(side == 0 || side == 1)
            return [19, 9, 20, 10];
        if(side == 2 + data)
            return [21, 9, 22, 10];
        return [20, 9, 21, 10];
    };
}

function buildBlock(arr, tarr, carr, x, y, z, scale, bInst, blockDmg, renderBottom, renderTop, renderBack, renderFront, renderLeft, renderRight, chunk) {
    var x1 = x + bInst.shape[0];
    var y1 = y + bInst.shape[1];
    var z1 = z + bInst.shape[2];
    var x2 = x + bInst.shape[0] + bInst.shape[3] * scale;
    var y2 = y + bInst.shape[1] + bInst.shape[4] * scale;
    var z2 = z + bInst.shape[2] + bInst.shape[5] * scale;
    var bColor = bInst.getColor(chunk, x, y, z, blockDmg);
    var bR = 1.0;
    var bG = 1.0;
    var bB = 1.0;
    var bA = 1.0;
    if(bColor != null) {
        bR = ((bColor & 0xFF0000) >>> 16) / 255;
        bG = ((bColor & 0xFF00) >>> 8) / 255;
        bB = (bColor & 0xFF) / 255;
        bA = 1.0; //((bColor & 0xFF000000) >>> 24) / 255;
    }
    if(renderBottom) {
        var bt = bInst.getTexture(blockDmg, 0);
        var tex = [bt[0] / 32 + TEXTURE_OFFSET, bt[1] / 16 + TEXTURE_OFFSET, (bt[2]) / 32 - TEXTURE_OFFSET, (bt[3]) / 16 - TEXTURE_OFFSET];
        arr.push(x2, y1, z2,
            x1, y1, z2,
            x2, y1, z1);
        arr.push(x1, y1, z2,
            x1, y1, z1,
            x2, y1, z1);
        //tarr.push(1, 1, 0, 1, 1, 0);
        //tarr.push(0, 1, 0, 0, 1, 0);
        tarr.push(tex[2], tex[3], tex[0], tex[3], tex[2], tex[1]);
        tarr.push(tex[0], tex[3], tex[0], tex[1], tex[2], tex[1]);
        if(carr != null)
            for(var j = 0; j < 6; j++) carr.push(bR, bG, bB, bA);
    }
    if(renderTop) {
        var bt = bInst.getTexture(blockDmg, 1);
        var tex = [bt[0] / 32 + TEXTURE_OFFSET, bt[1] / 16 + TEXTURE_OFFSET, (bt[2]) / 32 - TEXTURE_OFFSET, (bt[3]) / 16 - TEXTURE_OFFSET];
        arr.push(x2, y2, z2,
            x2, y2, z1,
            x1, y2, z2);
        arr.push(x1, y2, z2,
            x2, y2, z1,
            x1, y2, z1);
        //tarr.push(1, 1, 1, 0, 0, 1);
        //tarr.push(0, 1, 1, 0, 0, 0);
        tarr.push(tex[2], tex[3], tex[2], tex[1], tex[0], tex[3]);
        tarr.push(tex[0], tex[3], tex[2], tex[1], tex[0], tex[1]);
        if(carr != null)
            for(var j = 0; j < 6; j++) carr.push(bR, bG, bB, bA);
    }

    if(renderBack) {
        var bt = bInst.getTexture(blockDmg, 2);
        var tex = [bt[0] / 32 + TEXTURE_OFFSET, bt[3] / 16 - TEXTURE_OFFSET, (bt[2]) / 32 - TEXTURE_OFFSET, (bt[1]) / 16 + TEXTURE_OFFSET];
        arr.push(x2, y2, z1,
            x2, y1, z1,
            x1, y2, z1);
        arr.push(x1, y2, z1,
            x2, y1, z1,
            x1, y1, z1);
        //tarr.push(1, 1, 1, 0, 0, 1);
        //tarr.push(0, 1, 1, 0, 0, 0);
        tarr.push(tex[2], tex[3], tex[2], tex[1], tex[0], tex[3]);
        tarr.push(tex[0], tex[3], tex[2], tex[1], tex[0], tex[1]);
        if(carr != null)
            for(var j = 0; j < 6; j++) carr.push(bR, bG, bB, bA);
    }
    if(renderFront) {
        var bt = bInst.getTexture(blockDmg, 3);
        var tex = [bt[0] / 32 + TEXTURE_OFFSET, bt[3] / 16 - TEXTURE_OFFSET, (bt[2]) / 32 - TEXTURE_OFFSET, (bt[1]) / 16 + TEXTURE_OFFSET];
        arr.push(x2, y2, z2,
            x1, y2, z2,
            x2, y1, z2);
        arr.push(x1, y2, z2,
            x1, y1, z2,
            x2, y1, z2);
        //tarr.push(1, 1, 0, 1, 1, 0);
        //tarr.push(0, 1, 0, 0, 1, 0);
        tarr.push(tex[2], tex[3], tex[0], tex[3], tex[2], tex[1]);
        tarr.push(tex[0], tex[3], tex[0], tex[1], tex[2], tex[1]);
        if(carr != null)
            for(var j = 0; j < 6; j++) carr.push(bR, bG, bB, bA);
    }

    if(renderLeft) {
        var bt = bInst.getTexture(blockDmg, 4);
        var tex = [bt[0] / 32 + TEXTURE_OFFSET, bt[3] / 16 - TEXTURE_OFFSET, (bt[2]) / 32 - TEXTURE_OFFSET, (bt[1]) / 16 + TEXTURE_OFFSET];
        arr.push(x1, y2, z2,
            x1, y2, z1,
            x1, y1, z2);
        arr.push(x1, y1, z2,
            x1, y2, z1,
            x1, y1, z1);
        //tarr.push(1, 1, 1, 0, 0, 1);
        //tarr.push(0, 1, 1, 0, 0, 0);
        tarr.push(tex[2], tex[3], tex[0], tex[3], tex[2], tex[1]);
        tarr.push(tex[2], tex[1], tex[0], tex[3], tex[0], tex[1]);
        if(carr != null)
            for(var j = 0; j < 6; j++) carr.push(bR, bG, bB, bA);
    }
    if(renderRight) {
        var bt = bInst.getTexture(blockDmg, 5);
        var tex = [bt[2] / 32 - TEXTURE_OFFSET, bt[3] / 16 - TEXTURE_OFFSET, (bt[0]) / 32 + TEXTURE_OFFSET, (bt[1]) / 16 + TEXTURE_OFFSET];
        arr.push(x2, y2, z2,
            x2, y1, z2,
            x2, y2, z1);
        arr.push(x2, y1, z2,
            x2, y1, z1,
            x2, y2, z1);
        //tarr.push(1, 1, 0, 1, 1, 0);
        //tarr.push(0, 1, 0, 0, 1, 0);
        tarr.push(tex[2], tex[3], tex[2], tex[1], tex[0], tex[3]);
        tarr.push(tex[2], tex[1], tex[0], tex[1], tex[0], tex[3]);
        if(carr != null)
            for(var j = 0; j < 6; j++) carr.push(bR, bG, bB, bA);
    }
}

var blocks = {};
blocks["stone"] = blockIds[1] = new StoneBlock();
blocks["grass"] = blockIds[2] = new GrassBlock();
blocks["dirt"] = blockIds[3] = new Block(3, "Dirt", [11, 1]);
blocks["cobblestone"] = blockIds[4] = new Block(4, "Cobblestone", [26, 0]);
blocks["wood_planks"] = blockIds[5] = new WoodPlanksBlock();
blocks["wool"] = blockIds[35] = new WoolBlock();
blocks["carpet"] = blockIds[171] = new CarpetBlock();
blocks["quartz_block"] = blockIds[155] = new QuartzBlockBlock();
blocks["stained_clay"] = blockIds[159] = new StainedClayBlock();
blocks["snow_layer"] = blockIds[78] = new Block(78, "Snow layer", [5, 5]);
blockIds[78].shape = [0, 0, 0, 1, 0.1, 1];
blockIds[78].transparent = true;
blocks["iron_block"] = blockIds[42] = new Block(42, "Iron Block", [8, 3]);
blocks["lapis_lazuli_block"] = blockIds[22] = new Block(22, "Lapis Lazuli Block", [12, 3]);
blocks["glass"] = blockIds[20] = new Block(20, "Glass", [17, 4]);
blocks["chest"] = blockIds[54] = new ChestBlock();
blocks["updategame1"] = blockIds[248] = new Block(248, "Update game", [22, 9]);
blocks["updategame2"] = blockIds[249] = new Block(249, "Update game", [22, 9]);

function getBlockById(id) {
    if(id instanceof Array) {
        id = id[0];
    }
    var b = blockIds[id];
    if(b == null) return blocks["updategame1"];
    return b;
}
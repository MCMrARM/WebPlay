var itemIds = new Array(512);

function Item(id, name, texture) {
    this.id = id;
    this.name = name;
    this.texture = texture;
    if(this.texture.length == 2)
        this.texture = [texture[0], texture[1], texture[0] + 1, texture[1] + 1];

    this.getName = function(data) {
        return this.name;
    };
    this.getTexture = function(data, side) {
        return this.texture;
    };
}

var items = {};
items["stick"] = itemIds[280] = new Item(280, "Stick", [2, 13]);
items["potato"] = itemIds[392] = new Item(392, "Potato", [4, 9]);
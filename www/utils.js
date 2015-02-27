Object.prototype.extend = function(parent) {
    for(var key in parent) {
        if(parent.hasOwnProperty(key)) {
            this[key] = parent[key];
        }
    }
    return this;
}

function sign(x) {
	// http://stackoverflow.com/questions/7624920/number-sign-in-javascript
	return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
}

function computeNormalOfPlane(out, v1, v2) {
	out[0] = v1[1] * v2[2] - v1[2] * v2[1];
	out[1] = v1[2] * v2[0] - v1[0] * v2[2];
	out[2] = v1[0] * v2[1] - v1[1] * v2[0];
}

function gluLookAt(resultMatrix, matrix, eye, center, up) {
	var forward = vec3.create();
	var side = vec3.create();
	var up = vec3.create();
	var matrix2 = mat4.create();
	
	vec3.set(forward, center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]);
	vec3.normalize(forward, forward);
	computeNormalOfPlane(side, forward, up);
	vec3.normalize(side, side);
	computeNormalOfPlane(up, side, forward);
	matrix2[0] = side[0];
	matrix2[4] = side[1];
	matrix2[8] = side[2];
	matrix2[12] = 0;
	matrix2[1] = up[0];
	matrix2[5] = up[1];
	matrix2[9] = up[2];
	matrix2[13] = 0;
	matrix2[2] = -forward[0];
	matrix2[6] = -forward[1];
	matrix2[10] = -forward[2];
	matrix2[14] = 0;
	matrix2[3] = matrix2[7] = matrix2[11] = 0;
	matrix2[15] = 1;
	mat4.multiply(resultMatrix, matrix, matrix2);
	mat4.translate(resultMatrix, resultMatrix, vec3.set(vec3.create(), -eye[0], -eye[1], -eye[2]));
	return resultMatrix;
}

function gluUnproject(x, y, z) {
	var m = mat4.create();
	var _in = vec4.create();
	var _out = vec4.create();
	
	mat4.multiply(m, pMatrix, mvMatrix);
	if(mat4.invert(m, m) == null)
		return null;
	vec4.set(_in, x / gl.viewportWidth * 2.0 - 1.0, y / gl.viewportHeight * 2.0 - 1.0, 2.0 * z - 1.0, 1.0);
	vec4.transformMat4(_out, _in, m);
	if(_out[3] == 0)
		return null;
	_out[3] = 1.0 / _out[3];
	
	var coords = vec3.create();
	coords[0] = _out[0] * _out[3];
	coords[1] = _out[1] * _out[3];
	coords[2] = _out[2] * _out[3];
	return coords;
}

function raycast(client, x, y) {
	mat4.perspective(pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 300.0);
	mat4.identity(mvMatrix);
	translation = vec3.create();
	mat4.rotateX(mvMatrix, mvMatrix, client.pitch);
	mat4.rotateY(mvMatrix, mvMatrix, client.yaw);
	vec3.set(translation, -client.posX, -client.posY, -client.posZ);
	mat4.translate(mvMatrix, mvMatrix, translation);
	
	var near = gluUnproject(x, gl.viewportHeight-y, 0);
	var far = gluUnproject(x, gl.viewportHeight-y, 1);
	var dir = [1.0 / (far[0] - near[0]), 1.0 / (far[1] - near[1]), 1.0 / (far[2] - near[2])];
	
	// entity
	var hitEntity = null;
	var hitEntityDistance = -1;
	for(var entityId in client.entities) {
		if(!client.entities.hasOwnProperty(entityId)) continue;
		var entity = client.entities[entityId];
		var aabb = entity.getAABB();
		var v1 = (entity.x + aabb[0] - near[0]) * dir[0];
		var v2 = (entity.x + aabb[2] - near[0]) * dir[0];
		var v3 = (entity.y + aabb[1] - near[1]) * dir[1];
		var v4 = (entity.y + aabb[3] - near[1]) * dir[1];
		var v5 = (entity.z + aabb[0] - near[2]) * dir[2];
		var v6 = (entity.z + aabb[2] - near[2]) * dir[2];
		var vMin = Math.max(Math.max(Math.min(v1, v2), Math.min(v3, v4)), Math.min(v5, v6));
		var vMax = Math.min(Math.min(Math.max(v1, v2), Math.max(v3, v4)), Math.max(v5, v6));
		//console.log(vMax+" "+vMin);
		if (vMax < 0 || vMin > vMax) {
			continue;
		}
		if(hitEntityDistance == -1 || vMin < hitEntityDistance) {
			hitEntity = entity;
			hitEntityDistance = vMin;
		}
	}
	if(hitEntity != null) {
		hitEntityDistance = vec3.distance([hitEntity.x, hitEntity.y, hitEntity.z], near);
	}
	
	// block
	var bPos = [];
	bPos[0] = Math.floor(near[0]);
	bPos[1] = Math.floor(near[1]);
	bPos[2] = Math.floor(near[2]);
	var vbPos = null;
	var bSide = -1;
	var vbSide = -1;
	var signX = sign(dir[0]);
	var signY = sign(dir[1]);
	var signZ = sign(dir[2]);
	var sX = (signX > 0 ? (bPos[0] + 1 - near[0]) : (near[0] - bPos[0])) * dir[0];
	var sY = (signY > 0 ? (bPos[1] + 1 - near[1]) : (near[1] - bPos[1])) * dir[1];
	var sZ = (signZ > 0 ? (bPos[2] + 1 - near[2]) : (near[2] - bPos[2])) * dir[2];
	var hitBlock = null;
	var vHitBlock = null;
	
	for(var i = 0; i < 16; i++) {
		var mX = signX * sX;
		var mY = signY * sY;
		var mZ = signZ * sZ;
		if(mX < mY && mX < mZ) { sX += dir[0]; bPos[0] += signX; bSide = signX > 0 ? 4 : 5; }
		else if(mZ < mY && mZ < mX) { sZ += dir[2]; bPos[2] += signZ; bSide = signZ > 0 ? 2 : 3; }
		else { sY += dir[1]; bPos[1] += signY; bSide = signY > 0 ? 0 : 1; }
		
		var hitBlock = client.getBlock(bPos[0], bPos[1], bPos[2]);
		if(hitBlock == null) {
			if(bSide == 1 && vHitBlock == null) {
				var b = client.getBlock(bPos[0] + 1, bPos[1], bPos[2]);
				if(b != null) { vHitBlock = b; vbPos = [bPos[0] + 1, bPos[1], bPos[2]]; vbSide = 4; }
				b = client.getBlock(bPos[0] - 1, bPos[1], bPos[2]);
				if(b != null) { vHitBlock = b; vbPos = [bPos[0] - 1, bPos[1], bPos[2]]; vbSide = 5; }
				b = client.getBlock(bPos[0], bPos[1], bPos[2] + 1);
				if(b != null) { vHitBlock = b; vbPos = [bPos[0], bPos[1], bPos[2] + 1]; vbSide = 2; }
				b = client.getBlock(bPos[0], bPos[1], bPos[2] - 1);
				if(b != null) { vHitBlock = b; vbPos = [bPos[0], bPos[1], bPos[2] - 1]; vbSide = 3; }
			}
			continue;
		}
		break;
	}
	var hitBlockDistance = vec3.distance(bPos, near);
	
	if(hitEntity == null && hitBlock == null && vHitBlock == null) {
		return null;
	}
	if(hitBlock != null && (hitEntity == null || hitEntityDistance > hitBlockDistance)) {
		return {"isEntity": false, "isVirtual": false, "x": bPos[0], "y": bPos[1], "z": bPos[2], "side": bSide, "block": hitBlock, "distance": hitBlockDistance};
	}
	if(hitEntity != null) {
		return {"isEntity": true, "entity": hitEntity, "distance": hitEntityDistance};
	}
	if(vHitBlock != null) {
		return {"isEntity": false, "isVirtual": true, "x": vbPos[0], "y": vbPos[1], "z": vbPos[2], "side": vbSide, "distance": vec3.distance(vbPos, near)};
	}
	return null;
}

function createBuffer(verticles, entnum, type) {
	var buffer = gl.createBuffer();
	buffer.entnum = entnum;
	buffer.count = verticles.length / entnum;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticles), type);
	return buffer;
}

function compileShader(type, text) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, text);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.err("Cannot compile shader [type=" + type + "]");
		console.err(gl.getShaderInfoLog(shader));
		return null;
	}
	return shader;
}

function linkProgram(fragmentShaderCode, vertexShaderCode) {
	var fs = compileShader(gl.FRAGMENT_SHADER, fragmentShaderCode);
	if(fs == null) return false;
	var vs = compileShader(gl.VERTEX_SHADER, vertexShaderCode);
	if(vs == null) return false;
	var shader = gl.createProgram();
	gl.attachShader(shader, vs);
	gl.attachShader(shader, fs);
	gl.linkProgram(shader);
	if(!gl.getProgramParameter(shader, gl.LINK_STATUS)) {
		console.err("Cannot link shaders");
		return false;
	}
	gl.useProgram(shader);
	return shader;
}

function drawArray(buffer, drawMode, sp) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(sp.vertexPositionAttribute, buffer.entnum, gl.FLOAT, false, 0, 0);
	gl.uniformMatrix4fv(sp.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(sp.mvMatrixUniform, false, mvMatrix);
	gl.drawArrays(drawMode, 0, buffer.count);
}